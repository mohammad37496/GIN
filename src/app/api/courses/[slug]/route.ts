import { getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await ensureSchema();
    const { slug } = await params;
    const courseResult = await pool.query(`SELECT id, slug, title, summary, description, cover_image_url,
      access_type, estimated_minutes, published_at FROM courses WHERE slug=$1 AND status='published'`, [slug]);
    const course = courseResult.rows[0];
    if (!course) return errorResponse("دوره پیدا نشد.", 404);
    const user = await getSession();
    const enrollment = user ? await pool.query(`SELECT status FROM course_enrollments
      WHERE course_id=$1 AND user_id=$2 AND status IN ('active','completed')
      AND (expires_at IS NULL OR expires_at > NOW())`, [course.id, user.id]) : { rows: [] };
    const hasAccess = enrollment.rows.length > 0;
    const sectionsResult = await pool.query(`SELECT s.id, s.title, s.description, s.position,
      l.id AS lesson_id, l.title AS lesson_title, l.summary AS lesson_summary,
      l.duration_seconds, l.is_preview, l.position AS lesson_position,
      l.content, l.video_url, l.status AS lesson_status,
      lp.status AS progress_status, lp.last_position_seconds
      FROM course_sections s
      LEFT JOIN lessons l ON l.section_id=s.id AND l.status='published'
      LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$2
      WHERE s.course_id=$1
      ORDER BY s.position, l.position`, [course.id, user?.id ?? null]);
    const sections = new Map<number, { id: number; title: string; description: string; position: number; lessons: object[] }>();
    for (const row of sectionsResult.rows) {
      const sectionId = Number(row.id);
      if (!sections.has(sectionId)) sections.set(sectionId, { id: sectionId, title: row.title, description: row.description, position: row.position, lessons: [] });
      if (row.lesson_id) {
        const canOpen = hasAccess || row.is_preview;
        sections.get(sectionId)!.lessons.push({
          id: Number(row.lesson_id), title: row.lesson_title, summary: row.lesson_summary,
          durationSeconds: row.duration_seconds, isPreview: row.is_preview,
          isLocked: !canOpen, progressStatus: row.progress_status ?? "not_started",
          lastPositionSeconds: canOpen ? row.last_position_seconds ?? 0 : 0,
          ...(canOpen ? { content: row.content, videoUrl: row.video_url } : {}),
        });
      }
    }
    return jsonResponse({ course, isEnrolled: hasAccess, sections: [...sections.values()] });
  } catch {
    return errorResponse("دریافت اطلاعات دوره ممکن نشد.", 503);
  }
}
