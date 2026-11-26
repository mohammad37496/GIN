import { getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ assessmentId: string }> }) {
  const user = await getSession();
  if (!user) return errorResponse("برای مشاهده آزمون وارد شوید.", 401);
  const assessmentId = Number((await params).assessmentId);
  if (!Number.isSafeInteger(assessmentId) || assessmentId < 1) return errorResponse("آزمون پیدا نشد.", 404);
  try {
    await ensureSchema();
    const result = await pool.query(`SELECT a.id,a.course_id,a.title,a.description,a.time_limit_seconds,a.max_attempts,a.pass_percent,
      e.status AS enrollment_status,e.expires_at
      FROM assessments a JOIN course_enrollments e ON e.course_id=a.course_id AND e.user_id=$2
      JOIN courses c ON c.id=a.course_id
      WHERE a.id=$1 AND a.status='published' AND c.status='published'
        AND e.status IN ('active','completed') AND (e.expires_at IS NULL OR e.expires_at>NOW())`, [assessmentId,user.id]);
    const assessment = result.rows[0];
    if (!assessment) return errorResponse("آزمون در دسترس نیست یا دسترسی شما به دوره فعال نیست.", 403);
    const [questions, attempts] = await Promise.all([
      pool.query("SELECT id,question_type,prompt,options,points,position FROM assessment_questions WHERE assessment_id=$1 ORDER BY position", [assessmentId]),
      pool.query("SELECT COUNT(*)::int AS used FROM assessment_attempts WHERE assessment_id=$1 AND user_id=$2", [assessmentId,user.id]),
    ]);
    return jsonResponse({ assessment, questions: questions.rows, attemptsUsed: attempts.rows[0].used, attemptsRemaining: Math.max(0,assessment.max_attempts-attempts.rows[0].used) });
  } catch {
    return errorResponse("دریافت آزمون ممکن نشد.", 503);
  }
}
