import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { gradeChoiceAnswer } from "@/lib/domain";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema = z.object({ answers: z.array(z.object({ questionId: z.number().int().positive(), answer: z.unknown() })).min(1).max(200) });

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const user = await getSession();
  if (!user) return errorResponse("برای ارسال پاسخ وارد شوید.", 401);
  const attemptId = Number((await params).attemptId);
  if (!Number.isSafeInteger(attemptId) || attemptId < 1) return errorResponse("تلاش آزمون پیدا نشد.", 404);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("پاسخ‌های آزمون معتبر نیستند.");
  if (new Set(parsed.data.answers.map((answer) => answer.questionId)).size !== parsed.data.answers.length) return errorResponse("برای هر سؤال فقط یک پاسخ ارسال کنید.");
  try {
    await ensureSchema();
    const result = await inTransaction(async (client) => {
      const attempt = await client.query(`SELECT at.*,a.pass_percent,a.course_id FROM assessment_attempts at
        JOIN assessments a ON a.id=at.assessment_id WHERE at.id=$1 AND at.user_id=$2 FOR UPDATE OF at`, [attemptId,user.id]);
      if (!attempt.rowCount || attempt.rows[0].status !== "in_progress") return { unavailable: true as const };
      const current = attempt.rows[0];
      const enrollment = await client.query(`SELECT id FROM course_enrollments
        WHERE course_id=$1 AND user_id=$2 AND status IN ('active','completed')
          AND (expires_at IS NULL OR expires_at>clock_timestamp()) FOR UPDATE`, [current.course_id,user.id]);
      if (!enrollment.rowCount) return { enrollmentUnavailable: true as const };
      if (current.due_at && new Date(current.due_at).getTime() <= Date.now()) {
        await client.query("UPDATE assessment_attempts SET status='expired',submitted_at=NOW() WHERE id=$1", [attemptId]);
        return { expired: true as const };
      }
      const questions = await client.query("SELECT id,question_type,options,answer_key,points FROM assessment_questions WHERE assessment_id=$1", [current.assessment_id]);
      const questionMap = new Map(questions.rows.map((question) => [Number(question.id),question]));
      if (parsed.data.answers.length !== questions.rows.length || parsed.data.answers.some((answer) => !questionMap.has(answer.questionId))) return { mismatch: true as const };
      let possible = 0;
      let awarded = 0;
      let requiresManualGrade = false;
      for (const submitted of parsed.data.answers) {
        const question = questionMap.get(submitted.questionId)!;
        const points = Number(question.points);
        possible += points;
        let correct: boolean | null = null;
        let score = 0;
        if (question.question_type === "short_text") {
          if (typeof submitted.answer !== "string" || !submitted.answer.trim() || submitted.answer.length > 2000) return { invalid: true as const };
          requiresManualGrade = true;
        } else {
          if (question.question_type === "true_false") {
            if (typeof submitted.answer !== "boolean") return { invalid: true as const };
          } else {
            const options = Array.isArray(question.options) ? question.options : [];
            const allowed = new Set(options.map((option: { id?: unknown }) => String(option?.id ?? "")));
            if (question.question_type === "single_choice" && (typeof submitted.answer !== "string" || !allowed.has(submitted.answer))) return { invalid: true as const };
            if (question.question_type === "multiple_choice" && (!Array.isArray(submitted.answer) || submitted.answer.length === 0 ||
              new Set(submitted.answer).size !== submitted.answer.length || submitted.answer.some((value) => typeof value !== "string" || !allowed.has(value)))) return { invalid: true as const };
          }
          correct = gradeChoiceAnswer(question.question_type, question.answer_key, submitted.answer);
          score = correct ? points : 0;
        }
        awarded += score;
        await client.query(`INSERT INTO assessment_answers(attempt_id,question_id,answer,is_correct,points_awarded)
          VALUES($1,$2,$3::jsonb,$4,$5) ON CONFLICT(attempt_id,question_id) DO UPDATE SET
          answer=EXCLUDED.answer,is_correct=EXCLUDED.is_correct,points_awarded=EXCLUDED.points_awarded,answered_at=NOW()`,
        [attemptId,submitted.questionId,JSON.stringify(submitted.answer),correct,score]);
      }
      const percent = possible > 0 ? Math.round((awarded/possible)*10000)/100 : 0;
      const passed = requiresManualGrade ? null : percent >= Number(current.pass_percent);
      await client.query(`UPDATE assessment_attempts SET status=$1::varchar,submitted_at=NOW(),score_percent=$2,passed=$3,
        graded_at=CASE WHEN $1::varchar='graded' THEN NOW() ELSE NULL END WHERE id=$4`, [requiresManualGrade ? "submitted" : "graded",percent,passed,attemptId]);
      let courseCompleted = false;
      if (passed === true) {
        const completion = await client.query(`SELECT COUNT(l.id)::int AS total,
          COUNT(lp.id) FILTER (WHERE lp.status='completed')::int AS completed
          FROM course_sections s JOIN lessons l ON l.section_id=s.id AND l.status='published'
          LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$2 WHERE s.course_id=$1`, [current.course_id,user.id]);
        const pending = await client.query(`SELECT COUNT(*)::int AS count FROM assessments a WHERE a.course_id=$1 AND a.status='published'
          AND NOT EXISTS(SELECT 1 FROM assessment_attempts x WHERE x.assessment_id=a.id AND x.user_id=$2 AND x.status='graded' AND x.passed=TRUE)`, [current.course_id,user.id]);
        courseCompleted = completion.rows[0].total > 0 && completion.rows[0].total === completion.rows[0].completed && pending.rows[0].count === 0;
        if (courseCompleted) {
          const enrollment = await client.query("UPDATE course_enrollments SET status='completed',completed_at=COALESCE(completed_at,NOW()) WHERE course_id=$1 AND user_id=$2 AND status='active' RETURNING id", [current.course_id,user.id]);
          if (enrollment.rowCount) await client.query(`INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata)
            VALUES($1,'course_completed','course',$2,$3::jsonb)`, [user.id,current.course_id,JSON.stringify({ enrollmentId: enrollment.rows[0].id, assessmentAttemptId: attemptId })]);
        }
      }
      return { status: requiresManualGrade ? "submitted" : "graded", scorePercent: percent, passed, requiresManualGrade, courseCompleted };
    });
    if ("unavailable" in result) return errorResponse("این تلاش آزمون دیگر قابل ارسال نیست.", 409);
    if ("enrollmentUnavailable" in result) return errorResponse("دسترسی فعال شما به این دوره پایان یافته است.", 403);
    if ("expired" in result) return errorResponse("زمان آزمون به پایان رسیده است.", 409);
    if ("mismatch" in result) return errorResponse("باید برای تمام سؤال‌های آزمون دقیقاً یک پاسخ ارسال شود.", 400);
    if ("invalid" in result) return errorResponse("یکی از پاسخ‌ها معتبر نیست.", 400);
    return jsonResponse(result);
  } catch {
    return errorResponse("ثبت پاسخ‌های آزمون انجام نشد.", 503);
  }
}
