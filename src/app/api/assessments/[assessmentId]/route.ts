import { getSession } from "@/lib/auth";
import { ensureSchema, inTransaction, pool } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


 async function GET(_request: Request, { params }: { params: Promise<{ assessmentId: string }> }) {
  const user = await getSession();
  if (!user) return errorResponse("برای مشاهده آزمون وارد شوید.", 401);
  const assessmentId = Number((await params).assessmentId);
  if (!Number.isSafeInteger(assessmentId) || assessmentId < 1) return errorResponse("آزمون پیدا نشد.", 404);
  try {
    await ensureSchema();
    const result = await pool.query(`SELECT a.id,a.course_id,a.title,a.title_en,a.description,a.description_en,a.time_limit_seconds,a.max_attempts,a.pass_percent,a.shuffle_questions,
      e.status AS enrollment_status,e.expires_at
      FROM assessments a JOIN course_enrollments e ON e.course_id=a.course_id AND e.user_id=$2
      JOIN courses c ON c.id=a.course_id
      WHERE a.id=$1 AND a.status='published' AND c.status='published'
        AND e.status IN ('active','completed') AND (e.expires_at IS NULL OR e.expires_at>clock_timestamp())`, [assessmentId,user.id]);
    const assessment = result.rows[0];
    if (!assessment) return errorResponse("آزمون در دسترس نیست یا دسترسی شما به دوره فعال نیست.", 403);
    await inTransaction(async (client) => {
      await client.query(`UPDATE assessment_attempts SET status='expired',submitted_at=NOW()
        WHERE assessment_id=$1 AND user_id=$2 AND status='in_progress' AND due_at IS NOT NULL AND due_at<=clock_timestamp()`, [assessmentId,user.id]);
    });
    const [attempts, activeAttempt, attemptHistory] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS used FROM assessment_attempts WHERE assessment_id=$1 AND user_id=$2", [assessmentId,user.id]),
      pool.query("SELECT id,attempt_number,started_at,due_at FROM assessment_attempts WHERE assessment_id=$1 AND user_id=$2 AND status='in_progress' AND (due_at IS NULL OR due_at>clock_timestamp()) ORDER BY started_at DESC LIMIT 1", [assessmentId,user.id]),
      pool.query("SELECT attempt_number,status,started_at,submitted_at,score_percent,passed FROM assessment_attempts WHERE assessment_id=$1 AND user_id=$2 ORDER BY attempt_number DESC", [assessmentId,user.id]),
    ]);
    const questions = assessment.shuffle_questions && activeAttempt.rowCount
      ? await pool.query("SELECT id,question_type,prompt,prompt_en,options,points,position FROM assessment_questions WHERE assessment_id=$1 ORDER BY md5($2::text || ':' || id::text)", [assessmentId,String(activeAttempt.rows[0].id)])
      : await pool.query("SELECT id,question_type,prompt,prompt_en,options,points,position FROM assessment_questions WHERE assessment_id=$1 ORDER BY position", [assessmentId]);
    const activeAnswers = activeAttempt.rowCount ? await pool.query("SELECT question_id,answer FROM assessment_answers WHERE attempt_id=$1 ORDER BY question_id", [activeAttempt.rows[0].id]) : { rows: [] };
    return jsonResponse({ assessment, questions: questions.rows, activeAttempt: activeAttempt.rows[0] ?? null, activeAnswers: activeAnswers.rows, attemptHistory: attemptHistory.rows, attemptsUsed: attempts.rows[0].used, attemptsRemaining: Math.max(0,assessment.max_attempts-attempts.rows[0].used) });
  } catch {
    return errorResponse("دریافت آزمون ممکن نشد.", 503);
  }
}


const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
