import { z } from "zod";
import { getSession,hasRole } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const createSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  summary: z.string().trim().max(360).default(""),
  description: z.string().trim().max(12000).default(""),
  accessType: z.enum(["free", "members", "paid"]).default("free"),
  priceMinor: z.number().int().min(0).max(9_000_000_000).default(0),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  estimatedMinutes: z.number().int().min(0).max(100_000).default(0),
});

export async function GET() {
  const user = await getSession();
  if (!user || (user.role !== "admin" && !(await hasRole(user,"instructor")))) return errorResponse("دسترسی غیرمجاز است.", 403);
  try {
    await ensureSchema();
    const result = await pool.query(`SELECT c.id,c.slug,c.title,c.summary,c.description,c.status,c.access_type,
      c.price_minor,c.currency,c.estimated_minutes,c.created_at,
      COUNT(DISTINCT s.id)::int AS section_count,COUNT(DISTINCT l.id)::int AS lesson_count,
      COUNT(DISTINCT CASE WHEN l.status='published' THEN l.id END)::int AS published_lesson_count
      FROM courses c LEFT JOIN course_sections s ON s.course_id=c.id
      LEFT JOIN lessons l ON l.section_id=s.id
      WHERE ($1::boolean=TRUE OR EXISTS(SELECT 1 FROM course_instructors ci WHERE ci.course_id=c.id AND ci.user_id=$2))
      GROUP BY c.id ORDER BY c.created_at DESC`, [user.role === "admin",user.id]);
    const sections = await pool.query(`SELECT s.id,s.course_id,s.title,s.description,s.position,
      l.id AS lesson_id,l.title AS lesson_title,l.status AS lesson_status,l.duration_seconds,l.is_preview
      FROM course_sections s LEFT JOIN lessons l ON l.section_id=s.id
      WHERE ($1::boolean=TRUE OR EXISTS(SELECT 1 FROM course_instructors ci WHERE ci.course_id=s.course_id AND ci.user_id=$2))
      ORDER BY s.course_id,s.position,l.position`, [user.role === "admin",user.id]);
    const byCourse = new Map<number, { id:number; title:string; description:string; position:number; lessons:object[] }[]>();
    for (const row of sections.rows) {
      const courseId = Number(row.course_id);
      if (!byCourse.has(courseId)) byCourse.set(courseId, []);
      const list = byCourse.get(courseId)!;
      let section = list.find((item) => item.id === Number(row.id));
      if (!section) { section = { id:Number(row.id), title:row.title, description:row.description, position:row.position, lessons:[] }; list.push(section); }
      if (row.lesson_id) section.lessons.push({ id:Number(row.lesson_id), title:row.lesson_title, status:row.lesson_status, durationSeconds:row.duration_seconds, isPreview:row.is_preview });
    }
    return jsonResponse({ courses: result.rows.map((course) => ({ ...course, sections: byCourse.get(Number(course.id)) ?? [] })) });
  } catch {
    return errorResponse("دریافت دوره‌ها ممکن نشد.", 503);
  }
}

export async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const user = await getSession();
  if (!user || (user.role !== "admin" && !(await hasRole(user,"instructor")))) return errorResponse("دسترسی غیرمجاز است.", 403);
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("اطلاعات دوره معتبر نیست.");
  if (parsed.data.accessType !== "paid" && parsed.data.priceMinor !== 0) return errorResponse("برای دوره رایگان یا ویژه اعضا مبلغ نباید ثبت شود.");
  if (parsed.data.accessType === "paid" && (parsed.data.priceMinor < 1 || !parsed.data.currency)) return errorResponse("برای دوره پولی، مبلغ و کد ارز سه‌حرفی لازم است.");
  try {
    await ensureSchema();
    const { title, slug, summary, description, accessType, priceMinor, currency, estimatedMinutes } = parsed.data;
    const result = await pool.query(`INSERT INTO courses(slug,title,summary,description,access_type,price_minor,currency,estimated_minutes,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,slug,title,status`,
    [slug,title,summary,description,accessType,priceMinor,currency ?? null,estimatedMinutes,user.id]);
    if(user.role!=="admin")await pool.query("INSERT INTO course_instructors(course_id,user_id,assigned_by) VALUES($1,$2,$2) ON CONFLICT DO NOTHING",[result.rows[0].id,user.id]);
    return jsonResponse({ course: result.rows[0], message: "دوره به‌صورت پیش‌نویس ساخته شد." }, 201);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return errorResponse("این نشانی دوره قبلاً استفاده شده است.", 409);
    return errorResponse("ساخت دوره انجام نشد.", 503);
  }
}
