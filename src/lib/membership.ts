import type { PoolClient } from "pg";
import { inTransaction } from "@/lib/db";

/** Serialize membership mutations for a member across API requests. */
export async function lockMembershipUser(client: PoolClient, userId: number): Promise<void> {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [`gin-membership:${userId}`]);
}

/** Rebuilds the aggregate course entitlement projection inside the caller's transaction. */
export async function reconcileMembershipEntitlements(client: PoolClient, userId: number, actorId: number | null = null): Promise<void> {
  await client.query(`INSERT INTO course_enrollments(course_id,user_id,status,source,expires_at)
    SELECT pc.course_id,$1,'active','subscription',
      CASE WHEN BOOL_OR(m.ends_at IS NULL) THEN NULL ELSE MAX(m.ends_at) END
    FROM memberships m JOIN membership_plan_courses pc ON pc.plan_id=m.plan_id
    WHERE m.user_id=$1 AND m.status='active'
      AND (m.starts_at IS NULL OR m.starts_at<=NOW())
      AND (m.ends_at IS NULL OR m.ends_at>NOW())
    GROUP BY pc.course_id
    ON CONFLICT(course_id,user_id) DO UPDATE SET
      status=CASE WHEN course_enrollments.status='revoked' THEN 'active' ELSE course_enrollments.status END,
      source='subscription',
      expires_at=EXCLUDED.expires_at,
      enrolled_at=CASE WHEN course_enrollments.status='revoked' THEN NOW() ELSE course_enrollments.enrolled_at END,
      completed_at=CASE WHEN course_enrollments.status='revoked' THEN NULL ELSE course_enrollments.completed_at END
    WHERE course_enrollments.status='revoked' OR course_enrollments.source='subscription'`, [userId]);

  await client.query(`WITH candidates AS (
      SELECT ce.id,ce.status AS previous_status
      FROM course_enrollments ce
      WHERE ce.user_id=$1 AND ce.source='subscription' AND ce.status IN ('active','completed')
        AND (ce.expires_at IS NOT NULL AND ce.expires_at<=NOW() OR NOT EXISTS (
          SELECT 1 FROM memberships m JOIN membership_plan_courses pc ON pc.plan_id=m.plan_id
          WHERE m.user_id=$1 AND pc.course_id=ce.course_id AND m.status='active'
            AND (m.starts_at IS NULL OR m.starts_at<=NOW())
            AND (m.ends_at IS NULL OR m.ends_at>NOW())
        ))
      FOR UPDATE
    ), revoked AS (
      UPDATE course_enrollments ce SET status='revoked'
      FROM candidates c WHERE ce.id=c.id
      RETURNING ce.id
    )
    INSERT INTO course_enrollment_events(enrollment_id,actor_id,event_type,previous_status,next_status,reason)
    SELECT c.id,$2,'revoked',c.previous_status,'revoked','No active membership entitlement remains'
    FROM candidates c JOIN revoked r ON r.id=c.id`, [userId,actorId]);
}

/** Applies scheduled membership transitions and reconciles subscription course entitlements. */
export async function syncMembershipState(userId: number): Promise<void> {
  await inTransaction(async (client) => {
    await lockMembershipUser(client, userId);

    await client.query(`UPDATE memberships SET status='active',updated_at=NOW()
      WHERE user_id=$1 AND status='pending' AND (starts_at IS NULL OR starts_at<=NOW())
        AND (ends_at IS NULL OR ends_at>NOW())`, [userId]);

    const ended = await client.query(`UPDATE memberships
      SET status=CASE WHEN cancel_at_period_end THEN 'canceled' ELSE 'expired' END,
          updated_at=NOW(),
          canceled_at=CASE WHEN cancel_at_period_end THEN COALESCE(canceled_at,NOW()) ELSE canceled_at END,
          cancel_reason=CASE WHEN cancel_at_period_end THEN COALESCE(cancel_reason,'Canceled at period end') ELSE cancel_reason END
      WHERE user_id=$1 AND status IN ('active','past_due') AND ends_at IS NOT NULL AND ends_at<=NOW()
      RETURNING id,status`, [userId]);

    for (const membership of ended.rows) {
      await client.query(`INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata)
        VALUES(NULL,'membership_period_ended','membership',$1,$2::jsonb)`,
      [membership.id, JSON.stringify({ status: membership.status })]);
    }

    await reconcileMembershipEntitlements(client,userId);
  });
}
