import { getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { syncMembershipState } from "@/lib/membership";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const originError = rejectCrossOriginMutation(_request);
  if (originError) return originError;
  const user = await getSession();
  if (!user) return errorResponse("برای ثبت‌نام در دوره ابتدا وارد شوید.", 401);
  try {
    await ensureSchema();
    await syncMembershipState(user.id);
    const { slug } = await params;
    const enrolled = await inTransaction(async (client) => {
      const result = await client.query("SELECT id,access_type FROM courses WHERE slug=$1 AND status='published' FOR UPDATE", [slug]);
      const course = result.rows[0];
      if (!course) return { missing: true as const };
      let source: "free" | "subscription" = "free";
      let expiresAt: string | null = null;
      if (course.access_type === "paid") return { paid: true as const };
      if (course.access_type === "members") {
        const membership = await client.query(`SELECT m.id,m.ends_at FROM memberships m
          JOIN membership_plan_courses pc ON pc.plan_id=m.plan_id
          WHERE m.user_id=$1 AND pc.course_id=$2 AND m.status='active' AND (m.starts_at IS NULL OR m.starts_at<=NOW())
            AND (m.ends_at IS NULL OR m.ends_at>NOW()) ORDER BY m.ends_at DESC NULLS FIRST LIMIT 1 FOR UPDATE OF m`, [user.id,course.id]);
        if (!membership.rowCount) return { paid: true as const };
        source = "subscription";
        expiresAt = membership.rows[0].ends_at ? new Date(membership.rows[0].ends_at).toISOString() : null;
      }
      const inserted = await client.query(`INSERT INTO course_enrollments(course_id,user_id,source)
        VALUES($1,$2,$3) ON CONFLICT(course_id,user_id) DO UPDATE
        SET status='active',source=EXCLUDED.source,enrolled_at=NOW(),expires_at=$4,completed_at=NULL
        WHERE course_enrollments.status='revoked' OR (course_enrollments.source='subscription' AND course_enrollments.expires_at<=NOW()) RETURNING id`, [course.id,user.id,source,expiresAt]);
      if (!inserted.rowCount) return { existing: true as const };
      await client.query(`INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata)
        VALUES($1,'course_enrolled','course',$2,$3::jsonb)`, [user.id,course.id,JSON.stringify({source,expiresAt})]);
      return { enrolled: true as const };
    });
    if ("missing" in enrolled) return errorResponse("دوره پیدا نشد.", 404);
    if ("paid" in enrolled) return errorResponse("ثبت‌نام این دوره به عضویت یا پرداخت معتبر نیاز دارد؛ پرداخت هنوز فعال نشده است.", 409);
    if ("existing" in enrolled) return jsonResponse({ message: "شما قبلاً در این دوره ثبت‌نام کرده‌اید.", enrolled: true });
    return jsonResponse({ message: "ثبت‌نام در دوره با موفقیت انجام شد.", enrolled: true }, 201);
  } catch {
    return errorResponse("ثبت‌نام در دوره در حال حاضر ممکن نیست.", 503);
  }
}
