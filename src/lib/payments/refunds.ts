import type { PoolClient } from "pg";
import { reconcileMembershipEntitlements } from "../membership";

export type FullRefundInput = {
  transactionId: number;
  orderId: number;
  providerRefundId: string;
  amountMinor: number;
  currency: string;
  reason?: string;
};

/**
 * Reconciles all local entitlements and affiliate ledger effects for a verified
 * full refund. The caller must run this inside the same transaction as the
 * payment transaction status update and webhook event acknowledgement.
 */
export async function applyFullRefundEffects(client: PoolClient, input: FullRefundInput) {
  const refund = await client.query(
    `INSERT INTO payment_refunds(payment_transaction_id,provider_refund_id,amount_minor,currency,status,reason)
     VALUES($1,$2,$3,$4,'succeeded',$5)
     ON CONFLICT(payment_transaction_id,provider_refund_id) DO NOTHING
     RETURNING id`,
    [input.transactionId, input.providerRefundId, input.amountMinor, input.currency, input.reason ?? "Full payment refund confirmed by provider"],
  );
  if (!refund.rowCount) return { duplicate: true as const };

  const order = await client.query("SELECT user_id FROM orders WHERE id=$1 FOR UPDATE", [input.orderId]);
  if (!order.rowCount) throw new Error("Refund order does not exist");
  const userId = Number(order.rows[0].user_id);

  await client.query("UPDATE orders SET status='refunded' WHERE id=$1", [input.orderId]);

  const reversedCommissions = await client.query(`
    WITH reversed AS (
      UPDATE affiliate_commissions
      SET status='reversed'
      WHERE order_id=$1 AND status NOT IN ('reversed','rejected')
      RETURNING id,affiliate_id,amount_minor,currency
    )
    INSERT INTO affiliate_wallet_entries(affiliate_id,commission_id,entry_type,amount_minor,currency,description)
    SELECT r.affiliate_id,r.id,'debit',r.amount_minor,r.currency,'برگشت کمیسیون به علت بازپرداخت سفارش'
    FROM reversed r
    WHERE EXISTS (
      SELECT 1 FROM affiliate_wallet_entries credit
      WHERE credit.commission_id=r.id AND credit.entry_type='credit'
    )
    ON CONFLICT (commission_id) WHERE commission_id IS NOT NULL AND entry_type='debit' DO NOTHING
    RETURNING commission_id`, [input.orderId]);

  const revokedEnrollments = await client.query(`
    WITH candidates AS (
      SELECT id,status AS previous_status FROM course_enrollments
      WHERE source_order_id=$1 AND source='purchase' AND status IN ('active','completed')
      FOR UPDATE
    ), revoked AS (
      UPDATE course_enrollments enrollment SET status='revoked'
      FROM candidates candidate WHERE enrollment.id=candidate.id
      RETURNING enrollment.id
    )
    INSERT INTO course_enrollment_events(enrollment_id,actor_id,event_type,previous_status,next_status,reason)
    SELECT candidate.id,NULL,'revoked',candidate.previous_status,'revoked','Purchase payment refunded'
    FROM candidates candidate JOIN revoked ON revoked.id=candidate.id
    RETURNING enrollment_id`, [input.orderId]);

  await client.query(`UPDATE memberships
    SET status='canceled',cancel_at_period_end=FALSE,canceled_at=COALESCE(canceled_at,NOW()),
        cancel_reason='Payment refunded',updated_at=NOW()
    WHERE source_order_id=$1 AND status IN ('pending','active','past_due')`, [input.orderId]);
  await reconcileMembershipEntitlements(client, userId, null);

  await client.query(`UPDATE event_registrations
    SET status='canceled',canceled_at=COALESCE(canceled_at,NOW())
    WHERE order_id=$1 AND status IN ('registered','waitlisted')`, [input.orderId]);

  return {
    duplicate: false as const,
    refundId: Number(refund.rows[0].id),
    reversedCommissions: reversedCommissions.rowCount ?? 0,
    revokedEnrollments: revokedEnrollments.rowCount ?? 0,
  };
}
