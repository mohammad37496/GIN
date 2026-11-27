import type { PoolClient } from "pg";
import { lockMembershipUser, reconcileMembershipEntitlements } from "./membership";

export type AdminMembershipCancellationStatus = "canceled" | "expired";

export async function cancelAdminMembership(
  client: PoolClient,
  input: {
    membershipId: number;
    status: AdminMembershipCancellationStatus;
    reason: string;
    actorId: number;
  },
): Promise<{ id: number; status: AdminMembershipCancellationStatus } | null> {
  // Read the owner first, then take the same per-user lock used by grants,
  // member cancellation, and scheduled membership reconciliation.
  const owner = await client.query("SELECT user_id FROM memberships WHERE id=$1", [input.membershipId]);
  if (!owner.rowCount) return null;

  const userId = Number(owner.rows[0].user_id);
  if (!Number.isSafeInteger(userId) || userId < 1) return null;
  await lockMembershipUser(client, userId);

  const membership = await client.query(
    "SELECT id,user_id,status FROM memberships WHERE id=$1 FOR UPDATE",
    [input.membershipId],
  );
  if (!membership.rowCount || Number(membership.rows[0].user_id) !== userId || !["active", "pending", "past_due"].includes(membership.rows[0].status)) {
    return null;
  }

  await client.query(
    "UPDATE memberships SET status=$1,canceled_at=NOW(),cancel_reason=$2,updated_at=NOW() WHERE id=$3",
    [input.status, input.reason, input.membershipId],
  );
  await reconcileMembershipEntitlements(client, userId, input.actorId);
  await client.query(
    "INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'membership',$3,$4::jsonb)",
    [input.actorId, `membership_${input.status}`, input.membershipId, JSON.stringify({ userId, reason: input.reason })],
  );

  return { id: input.membershipId, status: input.status };
}
