import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema = z.object({ answers: z.array(z.object({ questionId: z.number().int().positive(), answer: z.unknown() })).min(1).max(200) });

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const user = await getSession();
  if (!user) return errorResponse("برای ذخیره پاسخ وارد شوید.", 401);
  const attemptId = Number((await params).attemptId);
  if (!Number.isSafeInteger(attemptId) || attemptId < 1) return errorResponse("تلاش آزمون پیدا نشد.", 404);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || new Set(parsed.data?.answers.map((item) => item.questionId)).size !== parsed.data?.answers.length) return errorResponse("پاسخ‌های آزمون معتبر نیستند.");
  try {
    await ensureSchema();
    const result = await inTransaction(async (client) => {
      const attempt = await client.query(`SELECT at.id,at.assessment_id,at.status,at.due_at,a.course_id
        FROM assessment_attempts at JOIN assessments a ON a.id=at.assessment_id
        WHERE at.id=$1 AND at.user_id=$2 FOR UPDATE OF at`, [attemptId,user.id]);
      if (!attempt.rowCount || attempt.rows[0].status !== "in_progress") return { unavailable: true as const };
      const enrollment = await client.query(`SELECT id FROM course_enrollments
        WHERE course_id=$1 AND user_id=$2 AND status IN ('active','completed')
          AND (expires_at IS NULL OR expires_at>clock_timestamp()) FOR UPDATE`, [attempt.rows[0].course_id,user.id]);
      if (!enrollment.rowCount) return { enrollmentUnavailable: true as const };
      if (attempt.rows[0].due_at && new Date(attempt.rows[0].due_at).getTime() <= Date.now()) {
        await client.query("UPDATE assessment_attempts SET status='expired',submitted_at=NOW() WHERE id=$1", [attemptId]);
        return { expired: true as const };
      }
      const ids = parsed.data.answers.map((item) => item.questionId);
      const questions = await client.query("SELECT id,question_type,options FROM assessment_questions WHERE assessment_id=$1 AND id=ANY($2::bigint[])", [attempt.rows[0].assessment_id,ids]);
      const questionMap = new Map(questions.rows.map((question) => [Number(question.id),question]));
      if (questionMap.size !== ids.length) return { invalid: true as const };
      for (const item of parsed.data.answers) {
        const question = questionMap.get(item.questionId)!;
        if (question.question_type === "true_false" && typeof item.answer !== "boolean") return { invalid: true as const };
        if (question.question_type === "short_text" && (typeof item.answer !== "string" || item.answer.length > 2000)) return { invalid: true as const };
        if (question.question_type === "single_choice" || question.question_type === "multiple_choice") {
          const options = Array.isArray(question.options) ? question.options : [];
          const allowed = new Set(options.map((option: { id?: unknown }) => String(option?.id ?? "")));
          const values = Array.isArray(item.answer) ? item.answer : [item.answer];
          if ((question.question_type === "single_choice" && (typeof item.answer !== "string" || !allowed.has(item.answer))) ||
            (question.question_type === "multiple_choice" && (!Array.isArray(item.answer) || values.some((value) => typeof value !== "string" || !allowed.has(value)) || new Set(values).size !== values.length))) return { invalid: true as const };
        }
      }
      for (const item of parsed.data.answers) await client.query(`INSERT INTO assessment_answers(attempt_id,question_id,answer,is_correct,points_awarded)
        VALUES($1,$2,$3::jsonb,NULL,0) ON CONFLICT(attempt_id,question_id) DO UPDATE SET answer=EXCLUDED.answer,answered_at=NOW()`,
      [attemptId,item.questionId,JSON.stringify(item.answer)]);
      return { saved: true as const };
    });
    if ("unavailable" in result) return errorResponse("این تلاش آزمون دیگر قابل ویرایش نیست.", 409);
    if ("enrollmentUnavailable" in result) return errorResponse("دسترسی فعال شما به این دوره پایان یافته است.", 403);
    if ("expired" in result) return errorResponse("زمان آزمون به پایان رسیده است.", 409);
    if ("invalid" in result) return errorResponse("یکی از پاسخ‌ها معتبر نیست.", 400);
    return jsonResponse(result);
  } catch {
    return errorResponse("ذخیره پاسخ‌های آزمون انجام نشد.", 503);
  }
}
