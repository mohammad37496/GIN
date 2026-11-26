import { z } from "zod";
import { canManageCourse, getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema = z.object({ titleEn: z.string().trim().max(180).nullable().optional(), descriptionEn: z.string().trim().max(4000).nullable().optional() })
  .refine((data) => Object.keys(data).length > 0);

export async function PATCH(request: Request, { params }: { params: Promise<{ sectionId: string }> }) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const user = await getSession();
  if (!user) return errorResponse("دسترسی غیرمجاز است.", 403);
  const sectionId = Number((await params).sectionId);
  if (!Number.isSafeInteger(sectionId) || sectionId < 1) return errorResponse("بخش پیدا نشد.", 404);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("ترجمه انگلیسی بخش معتبر نیست.");
  try {
    await ensureSchema();
    const result = await inTransaction(async (client) => {
      const section = await client.query("SELECT id,course_id FROM course_sections WHERE id=$1 FOR UPDATE", [sectionId]);
      if (!section.rowCount) return null;
      if (!(await canManageCourse(user, Number(section.rows[0].course_id), client))) return { forbidden: true as const };
      const updated = await client.query(`UPDATE course_sections SET title_en=CASE WHEN $1::boolean THEN $2 ELSE title_en END,
        description_en=CASE WHEN $3::boolean THEN $4 ELSE description_en END WHERE id=$5 RETURNING id,title_en,description_en`,
      [parsed.data.titleEn !== undefined, parsed.data.titleEn || null, parsed.data.descriptionEn !== undefined, parsed.data.descriptionEn || null, sectionId]);
      return updated.rows[0];
    });
    if (!result) return errorResponse("بخش پیدا نشد.", 404);
    if ("forbidden" in result) return errorResponse("دسترسی مدیریت دوره ندارید.", 403);
    return jsonResponse({ section: result, message: "ترجمه انگلیسی بخش ذخیره شد." });
  } catch { return errorResponse("ذخیره ترجمه بخش انجام نشد.", 503); }
}
