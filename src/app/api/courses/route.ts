import { ensureSchema, pool } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/http";

export async function GET() {
  try {
    await ensureSchema();
    const result = await pool.query(`
      SELECT c.id, c.slug, c.title, c.summary, c.cover_image_url, c.access_type,
        c.estimated_minutes, c.published_at,
        COUNT(l.id)::int AS lesson_count
      FROM courses c
      LEFT JOIN course_sections s ON s.course_id = c.id
      LEFT JOIN lessons l ON l.section_id = s.id AND l.status = 'published'
      WHERE c.status = 'published'
      GROUP BY c.id
      ORDER BY c.published_at DESC NULLS LAST, c.id DESC
    `);
    return jsonResponse({ courses: result.rows });
  } catch {
    return errorResponse("دریافت فهرست دوره‌ها ممکن نشد.", 503);
  }
}
