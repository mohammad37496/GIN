import { z } from "zod";
import { canManageCourse,getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


const schema = z.object({ title: z.string().trim().min(2).max(180), titleEn: z.string().trim().max(180).default(""), description: z.string().trim().max(4000).default(""), descriptionEn: z.string().trim().max(4000).default(""), position: z.number().int().min(0).max(10000).optional() });

 async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const user = await getSession();
  if (!user) return errorResponse("دسترسی غیرمجاز است.", 403);
  const { courseId: rawId } = await params;
  const courseId = Number(rawId);
  if (!Number.isSafeInteger(courseId) || courseId < 1) return errorResponse("دوره پیدا نشد.", 404);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("اطلاعات بخش معتبر نیست.");
  try {
    await ensureSchema();
    const result = await inTransaction(async (client) => {
      const course = await client.query("SELECT id FROM courses WHERE id=$1 FOR UPDATE", [courseId]);
      if (!course.rowCount) return null;
      if (!(await canManageCourse(user,courseId,client))) return { forbidden:true as const };
      const nextResult = await client.query("SELECT COALESCE(MAX(position),-1)+1 AS next FROM course_sections WHERE course_id=$1", [courseId]);
      const position = parsed.data.position ?? Number(nextResult.rows?.[0]?.next ?? 0);
      const inserted = await client.query("INSERT INTO course_sections(course_id,title,title_en,description,description_en,position) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,title,title_en,description,description_en,position", [courseId, parsed.data.title, parsed.data.titleEn || null, parsed.data.description, parsed.data.descriptionEn || null, position]);
      return inserted.rows?.[0] ?? null;
    });
    if (!result) return errorResponse("دوره پیدا نشد.", 404);
    if ("forbidden" in result) return errorResponse("شما به مدیریت این دوره دسترسی ندارید.",403);
    return jsonResponse({ section: result, message: "بخش دوره اضافه شد." }, 201);
  } catch (error) {
    console.error("Create course section failed", error);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return errorResponse("این ترتیب برای بخش دیگری استفاده شده است.", 409);
    return errorResponse("ساخت بخش انجام نشد.", 503);
  }
}


const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedPOST as POST };
