import type { PoolClient } from "pg";
import { lockMembershipUser, reconcileMembershipEntitlements } from "./membership";

export type AdminMembershipGrantInput = {
  userId: number;
  planId: number;
  startsAt: Date;
  endsAt: Date | null;
  actorId: number;
  reason: string;
};

export type AdminMembershipGrantResult =
  | { member: false }
  | { plan: false }
  | { duplicate: true }
  | { membership: { id: number; status: string; starts_at: Date; ends_at: Date | null } };

export async function grantAdminMembership(
  client: PoolClient,
  input: AdminMembershipGrantInput,
): Promise<AdminMembershipGrantResult> {
  // Serialize grants with cancellation, member cancellation, and scheduled transitions.
  await lockMembershipUser(client, input.userId);

  const member = await client.query("SELECT id,status FROM users WHERE id=$1 FOR UPDATE", [input.userId]);
  if (!member.rowCount || member.rows[0].status !== "approved") return { member: false };

  const plan = await client.query("SELECT id FROM membership_plans WHERE id=$1 AND is_active=TRUE FOR UPDATE", [input.planId]);
  if (!plan.rowCount) return { plan: false };

  const existing = await client.query(
    "SELECT id FROM memberships WHERE user_id=$1 AND plan_id=$2 AND status IN ('active','pending') AND (ends_at IS NULL OR ends_at>NOW())",
    [input.userId, input.planId],
  );
  if (existing.rowCount) return { duplicate: true };

  const membership = await client.query(
    `INSERT INTO memberships(user_id,plan_id,status,starts_at,ends_at,source,created_by)
      VALUES($1,$2,$3,$4,$5,'admin',$6) RETURNING id,status,starts_at,ends_at`,
    [input.userId, input.planId, input.startsAt > new Date() ? "pending" : "active", input.startsAt.toISOString(), input.endsAt?.toISOString() ?? null, input.actorId],
  );

  if (membership.rows[0].status === "active") {
    await reconcileMembershipEntitlements(client, input.userId, input.actorId);
  }
  await client.query(
    "INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,'membership_granted','membership',$2,$3::jsonb)",
    [input.actorId, membership.rows[0].id, JSON.stringify({ userId: input.userId, planId: input.planId, reason: input.reason })],
  );
  await client.query(
    "INSERT INTO notifications(user_id,type,title,body,href) VALUES($1,'membership_activated',$2,$3,'/dashboard')",
    [input.userId, membership.rows[0].status === "active" ? "عضویت فعال شد" : "عضویت زمان‌بندی شد", membership.rows[0].status === "active" ? "پلن عضویت شما فعال شد." : "عضویت شما از تاریخ تعیین‌شده فعال خواهد شد."],
  );

  return { membership: membership.rows[0] };
}
