import { getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


 async function POST(request: Request, { params }: { params: Promise<{ assessmentId: string }> }) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const user = await getSession();
  if (!user) return errorResponse("برای شروع آزمون وارد شوید.", 401);
  const assessmentId = Number((await params).assessmentId);
  if (!Number.isSafeInteger(assessmentId) || assessmentId < 1) return errorResponse("آزمون پیدا نشد.", 404);
  try {
    await ensureSchema();
    const result = await inTransaction(async (client) => {
      const assessment = await client.query(`SELECT a.*,e.id AS enrollment_id FROM assessments a
        JOIN course_enrollments e ON e.course_id=a.course_id AND e.user_id=$2
        JOIN courses c ON c.id=a.course_id
        WHERE a.id=$1 AND a.status='published' AND c.status='published'
          AND e.status IN ('active','completed') AND (e.expires_at IS NULL OR e.expires_at>clock_timestamp())
        FOR UPDATE OF a,e`, [assessmentId,user.id]);
      if (!assessment.rowCount) return { denied: true as const };
      const config = assessment.rows[0];
      await client.query(`UPDATE assessment_attempts SET status='expired',submitted_at=NOW()
        WHERE assessment_id=$1 AND user_id=$2 AND status='in_progress' AND due_at IS NOT NULL AND due_at<=clock_timestamp()`, [assessmentId,user.id]);
      const active = await client.query(`SELECT id,attempt_number,started_at,due_at FROM assessment_attempts
        WHERE assessment_id=$1 AND user_id=$2 AND status='in_progress' AND (due_at IS NULL OR due_at>clock_timestamp())
        ORDER BY started_at DESC LIMIT 1`, [assessmentId,user.id]);
      if (active.rowCount) {
        const questions = config.shuffle_questions
          ? await client.query("SELECT id,question_type,prompt,prompt_en,options,points,position FROM assessment_questions WHERE assessment_id=$1 ORDER BY md5($2::text || ':' || id::text)", [assessmentId,String(active.rows[0].id)])
          : await client.query("SELECT id,question_type,prompt,prompt_en,options,points,position FROM assessment_questions WHERE assessment_id=$1 ORDER BY position", [assessmentId]);
        return { attempt: active.rows[0], questions: questions.rows, timeLimitSeconds: config.time_limit_seconds, resumed: true };
      }
      const used = await client.query("SELECT COUNT(*)::int AS count FROM assessment_attempts WHERE assessment_id=$1 AND user_id=$2", [assessmentId,user.id]);
      if (used.rows[0].count >= config.max_attempts) return { exhausted: true as const };
      const attemptNumber = Number(used.rows[0].count)+1;
      const attempt = await client.query(`INSERT INTO assessment_attempts(assessment_id,user_id,attempt_number,due_at)
        VALUES($1,$2,$3,CASE WHEN $4::int>0 THEN clock_timestamp()+($4::int*INTERVAL '1 second') ELSE NULL END)
        RETURNING id,attempt_number,started_at,due_at`, [assessmentId,user.id,attemptNumber,config.time_limit_seconds]);
      const questions = config.shuffle_questions
        ? await client.query("SELECT id,question_type,prompt,prompt_en,options,points,position FROM assessment_questions WHERE assessment_id=$1 ORDER BY md5($2::text || ':' || id::text)", [assessmentId,String(attempt.rows[0].id)])
        : await client.query("SELECT id,question_type,prompt,prompt_en,options,points,position FROM assessment_questions WHERE assessment_id=$1 ORDER BY position", [assessmentId]);
      return { attempt: attempt.rows[0], questions: questions.rows, timeLimitSeconds: config.time_limit_seconds, resumed: false };
    });
    if ("denied" in result) return errorResponse("دسترسی فعال به دوره لازم است.", 403);
    if ("exhausted" in result) return errorResponse("تعداد تلاش‌های مجاز این آزمون به پایان رسیده است.", 409);
    return jsonResponse(result, 201);
  } catch {
    return errorResponse("شروع آزمون انجام نشد.", 503);
  }
}


const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedPOST as POST };
