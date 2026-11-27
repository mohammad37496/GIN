import { z } from "zod";
import { canManageCourse, getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


const schema = z.object({
  titleEn: z.string().trim().max(180).nullable().optional(),
  summaryEn: z.string().trim().max(360).nullable().optional(),
  contentEn: z.string().max(30000).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0);

 async function PATCH(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const user = await getSession();
  if (!user) return errorResponse("دسترسی غیرمجاز است.", 403);
  const lessonId = Number((await params).lessonId);
  if (!Number.isSafeInteger(lessonId) || lessonId < 1) return errorResponse("درس پیدا نشد.", 404);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("ترجمه انگلیسی درس معتبر نیست.");
  try {
    await ensureSchema();
    const result = await inTransaction(async (client) => {
      const lesson = await client.query("SELECT l.id,s.course_id FROM lessons l JOIN course_sections s ON s.id=l.section_id WHERE l.id=$1 FOR UPDATE OF l", [lessonId]);
      if (!lesson.rowCount) return null;
      if (!(await canManageCourse(user, Number(lesson.rows[0].course_id), client))) return { forbidden: true as const };
      const updated = await client.query(`UPDATE lessons SET title_en=CASE WHEN $1::boolean THEN $2 ELSE title_en END,
        summary_en=CASE WHEN $3::boolean THEN $4 ELSE summary_en END,
        content_en=CASE WHEN $5::boolean THEN $6 ELSE content_en END,updated_at=NOW()
        WHERE id=$7 RETURNING id,title_en,summary_en,content_en`,
      [parsed.data.titleEn !== undefined, parsed.data.titleEn || null, parsed.data.summaryEn !== undefined, parsed.data.summaryEn || null,
        parsed.data.contentEn !== undefined, parsed.data.contentEn || null, lessonId]);
      return updated.rows[0];
    });
    if (!result) return errorResponse("درس پیدا نشد.", 404);
    if ("forbidden" in result) return errorResponse("دسترسی مدیریت دوره ندارید.", 403);
    return jsonResponse({ lesson: result, message: "ترجمه انگلیسی درس ذخیره شد." });
  } catch { return errorResponse("ذخیره ترجمه درس انجام نشد.", 503); }
}


const wrappedPATCH = withApiErrorBoundary(PATCH);
export { wrappedPATCH as PATCH };
