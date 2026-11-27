import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { canManageCourse, getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { getStorageConfig } from "@/lib/storage";
import { errorResponse, jsonResponse } from "@/lib/http";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


 async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const lessonId = Number((await params).lessonId);
  if (!Number.isSafeInteger(lessonId) || lessonId < 1) return errorResponse("درس پیدا نشد.", 404);

  const user = await getSession();
  try {
    await ensureSchema();
    const lesson = await pool.query(`SELECT l.id,l.is_preview,c.id AS course_id,
      EXISTS(SELECT 1 FROM course_enrollments e WHERE e.course_id=c.id AND e.user_id=$2
        AND e.status IN ('active','completed') AND (e.expires_at IS NULL OR e.expires_at>NOW())) AS enrolled
      FROM lessons l JOIN course_sections s ON s.id=l.section_id JOIN courses c ON c.id=s.course_id
      WHERE l.id=$1 AND l.status='published' AND c.status='published'`, [lessonId, user?.id ?? null]);
    if (!lesson.rowCount) return errorResponse("درس پیدا نشد.", 404);

    const canManage = user ? await canManageCourse(user, Number(lesson.rows[0].course_id)) : false;
    if (!lesson.rows[0].is_preview && !lesson.rows[0].enrolled && !canManage) {
      return errorResponse(user ? "برای دریافت منابع این درس باید در دوره ثبت‌نام کنید." : "برای دریافت منابع این درس وارد شوید.", user ? 403 : 401);
    }

    const storage = getStorageConfig();
    if (!storage) return errorResponse("فضای ذخیره‌سازی پیکربندی نشده است.", 503);
    const resources = await pool.query("SELECT id,title,object_key,content_type,size_bytes,is_downloadable FROM learning_resources WHERE lesson_id=$1 ORDER BY position", [lessonId]);
    const signed = await Promise.all(resources.rows.map(async (resource) => ({
      id: Number(resource.id),
      title: resource.title,
      contentType: resource.content_type,
      sizeBytes: Number(resource.size_bytes),
      isDownloadable: resource.is_downloadable,
      url: await getSignedUrl(storage.client, new GetObjectCommand({
        Bucket: storage.bucket,
        Key: resource.object_key,
        ResponseContentDisposition: resource.is_downloadable ? `attachment; filename*=UTF-8''${encodeURIComponent(resource.title)}` : "inline",
      }), { expiresIn: 120 }),
    })));
    return jsonResponse({ resources: signed });
  } catch {
    return errorResponse("دریافت منابع درس انجام نشد.", 503);
  }
}


const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
