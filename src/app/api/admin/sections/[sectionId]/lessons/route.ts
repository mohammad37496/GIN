import { z } from "zod";
import { canManageCourse,getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema = z.object({
  title: z.string().trim().min(2).max(180),
  titleEn: z.string().trim().max(180).default(""),
  summary: z.string().trim().max(360).default(""),
  summaryEn: z.string().trim().max(360).default(""),
  content: z.string().max(30000).default(""),
  contentEn: z.string().max(30000).default(""),
  videoUrl: z.string().url().max(2000).refine((value) => { try { return new URL(value).protocol === "https:"; } catch { return false; } }).optional().or(z.literal("")),
  durationSeconds: z.number().int().min(0).max(24 * 60 * 60).default(0),
  isPreview: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("published"),
  position: z.number().int().min(0).max(10000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ sectionId: string }> }) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const user = await getSession();
  if (!user) return errorResponse("دسترسی غیرمجاز است.", 403);
  const { sectionId: rawId } = await params;
  const sectionId = Number(rawId);
  if (!Number.isSafeInteger(sectionId) || sectionId < 1) return errorResponse("بخش پیدا نشد.", 404);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("اطلاعات درس معتبر نیست.");
  try {
    await ensureSchema();
    const result = await inTransaction(async (client) => {
      const section = await client.query("SELECT id,course_id FROM course_sections WHERE id=$1 FOR UPDATE", [sectionId]);
      if (!section.rowCount) return null;
      if (!(await canManageCourse(user,Number(section.rows[0].course_id),client))) return { forbidden:true as const };
      const nextResult = await client.query("SELECT COALESCE(MAX(position),-1)+1 AS next FROM lessons WHERE section_id=$1", [sectionId]);
      const position = parsed.data.position ?? Number(nextResult.rows?.[0]?.next ?? 0);
      return (await client.query(`INSERT INTO lessons(section_id,title,title_en,summary,summary_en,content,content_en,video_url,duration_seconds,is_preview,status,position)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id,title,title_en,status,position`,
      [sectionId,parsed.data.title,parsed.data.titleEn || null,parsed.data.summary,parsed.data.summaryEn || null,parsed.data.content,parsed.data.contentEn || null,parsed.data.videoUrl || null,parsed.data.durationSeconds,parsed.data.isPreview,parsed.data.status,position])).rows?.[0] ?? null;
    });
    if (!result) return errorResponse("بخش پیدا نشد.", 404);
    if ("forbidden" in result) return errorResponse("شما به مدیریت این دوره دسترسی ندارید.",403);
    return jsonResponse({ lesson: result, message: "درس به بخش اضافه شد." }, 201);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return errorResponse("این ترتیب برای درس دیگری استفاده شده است.", 409);
    return errorResponse("ساخت درس انجام نشد.", 503);
  }
}
