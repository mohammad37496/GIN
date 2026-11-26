import { z } from "zod";
import { canManageCourse,getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  titleEn: z.string().trim().max(180).nullable().optional(),
  summaryEn: z.string().trim().max(360).nullable().optional(),
  descriptionEn: z.string().trim().max(12000).nullable().optional(),
}).refine((data) => Object.keys(data).length > 0);

export async function PATCH(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const user = await getSession();
  if (!user) return errorResponse("دسترسی غیرمجاز است.", 403);
  const { courseId: rawId } = await params;
  const courseId = Number(rawId);
  if (!Number.isSafeInteger(courseId) || courseId < 1) return errorResponse("دوره پیدا نشد.", 404);
  if (!(await canManageCourse(user,courseId))) return errorResponse("شما به مدیریت این دوره دسترسی ندارید.",403);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("وضعیت دوره معتبر نیست.");
  try {
    await ensureSchema();
    const result = await inTransaction(async (client) => {
      const locked = await client.query("SELECT id,status FROM courses WHERE id=$1 FOR UPDATE", [courseId]);
      if (!locked.rowCount) return null;
      if (!(await canManageCourse(user,courseId,client))) return { forbidden:true as const };
      if (parsed.data.status === "published") {
        const content = await client.query(`SELECT COUNT(*)::int AS count FROM course_sections s JOIN lessons l ON l.section_id=s.id
          WHERE s.course_id=$1 AND l.status='published'`, [courseId]);
        if (!content.rows[0] || content.rows[0].count < 1) return { invalid: true as const };
      }
      const updated = await client.query(`UPDATE courses SET
        status=COALESCE($1::varchar,status),
        title_en=CASE WHEN $2::boolean THEN $3 ELSE title_en END,
        summary_en=CASE WHEN $4::boolean THEN $5 ELSE summary_en END,
        description_en=CASE WHEN $6::boolean THEN $7 ELSE description_en END,
        updated_at=NOW(),published_at=CASE WHEN $1::varchar='published' THEN COALESCE(published_at,NOW()) ELSE published_at END
        WHERE id=$8 RETURNING id,status,title_en,summary_en,description_en`,
      [parsed.data.status ?? null, parsed.data.titleEn !== undefined, parsed.data.titleEn || null,
        parsed.data.summaryEn !== undefined, parsed.data.summaryEn || null, parsed.data.descriptionEn !== undefined,
        parsed.data.descriptionEn || null, courseId]);
      await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'course',$3,$4::jsonb)",
        [user.id, parsed.data.status ? `course_${parsed.data.status}` : "course_english_content_updated", courseId,
          JSON.stringify({ previousStatus: locked.rows[0].status, nextStatus: parsed.data.status ?? locked.rows[0].status, changes: parsed.data })]);
      return updated.rows[0];
    });
    if (!result) return errorResponse("دوره پیدا نشد.", 404);
    if ("forbidden" in result) return errorResponse("شما به مدیریت این دوره دسترسی ندارید.",403);
    if ("invalid" in result) return errorResponse("برای انتشار، دست‌کم یک درس منتشرشده به دوره اضافه کنید.", 409);
    return jsonResponse({ course: result, message: parsed.data.status ? "وضعیت دوره به‌روزرسانی شد." : "ترجمه انگلیسی دوره ذخیره شد." });
  } catch (error) {
    console.error("Update course status failed", error);
    return errorResponse("تغییر وضعیت دوره انجام نشد.", 503);
  }
}
