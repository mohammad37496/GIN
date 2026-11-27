import { withApiErrorBoundary } from "@/lib/api-error-boundary";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema = z.object({ nameEn: z.string().trim().max(140).nullable().optional(), descriptionEn: z.string().max(2000).nullable().optional() })
  .refine((data) => Object.keys(data).length > 0);

async function PATCH(request: Request, { params }: { params: Promise<{ categoryId: string }> }) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const admin = await requireAdmin();
  if (!admin) return errorResponse("دسترسی غیرمجاز است.", 403);
  const id = Number((await params).categoryId);
  if (!Number.isSafeInteger(id) || id < 1) return errorResponse("دسته‌بندی پیدا نشد.", 404);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("ترجمه انگلیسی دسته‌بندی معتبر نیست.");
  try {
    await ensureSchema();
    const updated = await pool.query(`UPDATE course_categories SET
      name_en=CASE WHEN $1::boolean THEN $2 ELSE name_en END,
      description_en=CASE WHEN $3::boolean THEN $4 ELSE description_en END
      WHERE id=$5 RETURNING id,name_en,description_en`,
    [parsed.data.nameEn !== undefined, parsed.data.nameEn || null, parsed.data.descriptionEn !== undefined, parsed.data.descriptionEn || null, id]);
    if (!updated.rowCount) return errorResponse("دسته‌بندی پیدا نشد.", 404);
    await pool.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,'course_category_english_updated','course_category',$2,$3::jsonb)", [admin.id, id, JSON.stringify(parsed.data)]);
    return jsonResponse({ category: updated.rows[0], message: "ترجمه انگلیسی دسته‌بندی ذخیره شد." });
  } catch { return errorResponse("ذخیره ترجمه دسته‌بندی انجام نشد.", 503); }
}

const wrappedPATCH = withApiErrorBoundary(PATCH);
export { wrappedPATCH as PATCH };
