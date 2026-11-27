import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { isValidCompletionPosition } from "@/lib/domain";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


const schema = z.object({ status: z.enum(["in_progress", "completed"]), watchedSeconds: z.number().int().min(0).max(24 * 60 * 60), lastPositionSeconds: z.number().int().min(0).max(24 * 60 * 60) });

 async function POST(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const user = await getSession();
  if (!user) return errorResponse("برای ثبت پیشرفت ابتدا وارد شوید.", 401);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("اطلاعات پیشرفت معتبر نیست.");
  const { lessonId: rawId } = await params;
  const lessonId = Number(rawId);
  if (!Number.isSafeInteger(lessonId) || lessonId < 1) return errorResponse("درس پیدا نشد.", 404);
  try {
    await ensureSchema();
    const result = await inTransaction(async (client) => {
      const access = await client.query(`SELECT l.id,l.duration_seconds,c.id AS course_id,e.id AS enrollment_id FROM lessons l
      JOIN course_sections s ON s.id=l.section_id
      JOIN courses c ON c.id=s.course_id
      JOIN course_enrollments e ON e.course_id=c.id AND e.user_id=$2
      WHERE l.id=$1 AND l.status='published' AND c.status='published'
        AND e.status IN ('active','completed') AND (e.expires_at IS NULL OR e.expires_at > NOW())
      FOR UPDATE OF e`, [lessonId, user.id]);
      if (!access.rowCount) return { denied: true as const };
      const { status, watchedSeconds, lastPositionSeconds } = parsed.data;
      const durationSeconds = Number(access.rows[0].duration_seconds);
      if (!isValidCompletionPosition({ durationSeconds, watchedSeconds, lastPositionSeconds }) || (status === "completed" && durationSeconds > 30 && watchedSeconds < durationSeconds - 30)) {
        return { invalid: true as const };
      }
      if (status === "in_progress") {
        const progress = await client.query(`INSERT INTO lesson_progress(lesson_id,user_id,status,watched_seconds,last_position_seconds)
          VALUES($1,$2,'in_progress',$3,$4)
          ON CONFLICT(lesson_id,user_id) DO UPDATE SET
            status=CASE WHEN lesson_progress.status='completed' THEN 'completed' ELSE 'in_progress' END,
            watched_seconds=GREATEST(lesson_progress.watched_seconds,EXCLUDED.watched_seconds),
            last_position_seconds=CASE WHEN lesson_progress.status='completed' OR EXCLUDED.last_position_seconds=0 THEN lesson_progress.last_position_seconds ELSE EXCLUDED.last_position_seconds END,
            updated_at=NOW()
          RETURNING started_at,status`, [lessonId,user.id,watchedSeconds,lastPositionSeconds]);
        return { courseCompleted: false, startedAt: progress.rows[0].started_at, alreadyCompleted: progress.rows[0].status === "completed" };
      }

      const progress = await client.query(`SELECT started_at FROM lesson_progress
        WHERE lesson_id=$1 AND user_id=$2 FOR UPDATE`, [lessonId,user.id]);
      if (!progress.rowCount) return { notStarted: true as const };
      const elapsed = await client.query(`SELECT FLOOR(EXTRACT(EPOCH FROM (NOW()-$1::timestamptz)))::int AS seconds`, [progress.rows[0].started_at]);
      const requiredSeconds = Math.max(0,durationSeconds-30);
      const elapsedSeconds = Math.max(0,Number(elapsed.rows[0].seconds));
      if (elapsedSeconds < requiredSeconds) return { tooSoon: true as const, remainingSeconds: requiredSeconds-elapsedSeconds };

      await client.query(`UPDATE lesson_progress SET status='completed',
        watched_seconds=GREATEST(watched_seconds,$3),last_position_seconds=$4,
        updated_at=NOW(),completed_at=COALESCE(completed_at,NOW())
        WHERE lesson_id=$1 AND user_id=$2`, [lessonId,user.id,watchedSeconds,lastPositionSeconds]);
      let courseCompleted = false;
      if (status === "completed") {
        const totals = await client.query(`SELECT COUNT(l.id)::int AS total,
        COUNT(lp.id) FILTER (WHERE lp.status='completed')::int AS completed
        FROM course_sections s JOIN lessons l ON l.section_id=s.id AND l.status='published'
        LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$2
        WHERE s.course_id=$1`, [access.rows[0].course_id, user.id]);
        const pendingAssessments = await client.query(`SELECT COUNT(*)::int AS count FROM assessments a
          WHERE a.course_id=$1 AND a.status='published' AND NOT EXISTS(
            SELECT 1 FROM assessment_attempts at WHERE at.assessment_id=a.id AND at.user_id=$2 AND at.status='graded' AND at.passed=TRUE
          )`, [access.rows[0].course_id,user.id]);
        courseCompleted = totals.rows[0].total > 0 && totals.rows[0].total === totals.rows[0].completed && pendingAssessments.rows[0].count === 0;
        if (courseCompleted) {
          await client.query(`UPDATE course_enrollments SET status='completed',completed_at=COALESCE(completed_at,NOW())
            WHERE id=$1 AND status='active'`, [access.rows[0].enrollment_id]);
          await client.query(`INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata)
            VALUES($1,'course_completed','course',$2,$3::jsonb)`, [user.id, access.rows[0].course_id, JSON.stringify({ enrollmentId: access.rows[0].enrollment_id })]);
        }
      }
      return { courseCompleted };
    });
    if ("denied" in result) return errorResponse("برای ثبت پیشرفت این درس باید در دوره فعال باشید.", 403);
    if ("invalid" in result) return errorResponse("میزان پیشرفت با مدت درس سازگار نیست.", 400);
    if ("notStarted" in result) return errorResponse("ابتدا درس را باز کنید تا زمان شروع یادگیری ثبت شود.", 409);
    if ("tooSoon" in result) return errorResponse(`برای تکمیل درس هنوز ${result.remainingSeconds} ثانیه زمان لازم است.`, 409);
    return jsonResponse({ message: parsed.data.status === "completed" ? "پیشرفت درس ثبت شد." : "موقعیت یادگیری ذخیره شد.", courseCompleted: result.courseCompleted, startedAt: "startedAt" in result ? result.startedAt : undefined });
  } catch (error) {
    console.error("Save lesson progress failed", error);
    return errorResponse("ذخیره پیشرفت درس ممکن نشد.", 503);
  }
}


const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedPOST as POST };
