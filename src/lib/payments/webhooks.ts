import type { PoolClient } from "pg";
import type { VerifiedWebhook } from "@/lib/payments/provider";
import { calculateCommission, isAllowedPaymentTransition } from "@/lib/domain";
import { applyFullRefundEffects } from "@/lib/payments/refunds";

export async function processVerifiedPaymentWebhook(client: PoolClient, providerName: string, verified: VerifiedWebhook) {
  const payload = {
    transactionReference: verified.transactionReference,
    outcome: verified.outcome,
    amountMinor: verified.amountMinor,
    currency: verified.currency,
    refundReference: verified.refundReference?.trim() || null,
  };
  const inserted = await client.query(`INSERT INTO payment_webhook_events(provider,provider_event_id,event_type,payload)
    VALUES($1,$2,$3,$4::jsonb)
    ON CONFLICT(provider,provider_event_id) DO UPDATE SET status='received',processed_at=NULL
    WHERE payment_webhook_events.status IN ('retryable','received','ignored')
      AND payment_webhook_events.event_type=EXCLUDED.event_type
      AND payment_webhook_events.payload=EXCLUDED.payload
    RETURNING id`, [providerName,verified.eventId,verified.eventType,JSON.stringify(payload)]);
  if (!inserted.rowCount) {
    const existing = await client.query("SELECT event_type,payload FROM payment_webhook_events WHERE provider=$1 AND provider_event_id=$2", [providerName,verified.eventId]);
    if (existing.rowCount) {
      const previous = existing.rows[0].payload ?? {};
      const samePayload = existing.rows[0].event_type === verified.eventType
        && previous.transactionReference === payload.transactionReference
        && previous.outcome === payload.outcome
        && Number(previous.amountMinor) === payload.amountMinor
        && previous.currency === payload.currency
        && (previous.refundReference ?? null) === payload.refundReference;
      if (!samePayload) return { conflict: true as const };
    }
    return { duplicate: true as const };
  }
  const eventId = inserted.rows[0].id;

  const transaction = await client.query("SELECT * FROM payment_transactions WHERE provider=$1 AND provider_reference=$2 FOR UPDATE", [providerName,verified.transactionReference]);
  if (!transaction.rowCount) {
    await client.query("UPDATE payment_webhook_events SET status='retryable',processed_at=NULL WHERE id=$1", [eventId]);
    return { retryable: true as const };
  }
  const tx = transaction.rows[0];
  if (Number(tx.amount_minor) !== verified.amountMinor || tx.currency !== verified.currency) {
    await client.query("UPDATE payment_webhook_events SET status='failed',processed_at=NOW() WHERE id=$1", [eventId]);
    return { mismatch: true as const };
  }
  const nextStatus: "succeeded" | "failed" | "canceled" | "refunded" = verified.outcome === "succeeded" ? "succeeded" : verified.outcome === "failed" ? "failed" : verified.outcome === "canceled" ? "canceled" : "refunded";
  if (tx.status === nextStatus) {
    await client.query("UPDATE payment_webhook_events SET status='processed',processed_at=NOW() WHERE id=$1", [eventId]);
    return { duplicate: true as const };
  }
  if (!isAllowedPaymentTransition(tx.status,nextStatus)) {
    await client.query("UPDATE payment_webhook_events SET status='ignored',processed_at=NOW() WHERE id=$1", [eventId]);
    return { invalidTransition: true as const };
  }
  await client.query(`UPDATE payment_transactions SET status=$1::varchar,updated_at=NOW(),
    succeeded_at=CASE WHEN $1::varchar='succeeded' THEN NOW() ELSE succeeded_at END WHERE id=$2`, [nextStatus,tx.id]);

  if (nextStatus === "succeeded") {
    await client.query("UPDATE orders SET status='paid',paid_at=NOW() WHERE id=$1 AND status='pending'", [tx.order_id]);
    const order = await client.query("SELECT public_id,user_id FROM orders WHERE id=$1", [tx.order_id]);
    const items = await client.query("SELECT * FROM order_items WHERE order_id=$1", [tx.order_id]);
    for (const item of items.rows) {
      if (item.item_type === "course") {
        await client.query(`INSERT INTO course_enrollments(course_id,user_id,status,source,source_order_id)
          VALUES($1,$2,'active','purchase',$3) ON CONFLICT(course_id,user_id) DO UPDATE SET
            status=CASE WHEN course_enrollments.status='revoked' THEN 'active' ELSE course_enrollments.status END,
            source='purchase',source_order_id=EXCLUDED.source_order_id,expires_at=NULL
          WHERE course_enrollments.status='revoked' OR course_enrollments.source='subscription'`, [item.item_id,order.rows[0].user_id,tx.order_id]);
      } else if (item.item_type === "membership") {
        const plan = await client.query("SELECT billing_interval FROM membership_plans WHERE id=$1", [item.item_id]);
        const interval = plan.rows[0]?.billing_interval;
        const intervalValue = interval === "month" ? "1 month" : interval === "year" ? "1 year" : null;
        await client.query(`INSERT INTO memberships(user_id,plan_id,status,starts_at,ends_at,source,provider,source_order_id)
          VALUES($1,$2,'active',NOW(),CASE WHEN $3::text IS NULL THEN NULL ELSE NOW()+$3::interval END,'payment',$4,$5)`, [order.rows[0].user_id,item.item_id,intervalValue,providerName,tx.order_id]);
      } else if (item.item_type === "event") {
        const event = await client.query("SELECT id,capacity FROM events WHERE id=$1 AND status='published' FOR UPDATE", [item.item_id]);
        if (event.rowCount) {
          const count = await client.query("SELECT COUNT(*)::int AS count FROM event_registrations WHERE event_id=$1 AND status='registered'", [item.item_id]);
          const status = event.rows[0].capacity !== null && count.rows[0].count >= event.rows[0].capacity ? "waitlisted" : "registered";
          await client.query("INSERT INTO event_registrations(event_id,user_id,status,order_id) VALUES($1,$2,$3,$4) ON CONFLICT(event_id,user_id) DO NOTHING", [item.item_id,order.rows[0].user_id,status,tx.order_id]);
        }
      }
      const referral = await client.query(`SELECT ra.affiliate_id,ra.referred_user_id FROM referral_attributions ra
        JOIN affiliate_accounts aa ON aa.id=ra.affiliate_id AND aa.status='active'
        WHERE ra.referred_user_id=$1`, [order.rows[0].user_id]);
      if (referral.rowCount) {
        const rule = await client.query(`SELECT * FROM commission_rules WHERE item_type=$1 AND is_active=TRUE AND starts_at<=NOW()
          AND (ends_at IS NULL OR ends_at>NOW()) AND (currency IS NULL OR currency=$2) ORDER BY starts_at DESC LIMIT 1`, [item.item_type,tx.currency]);
        if (rule.rowCount) {
          const commission = calculateCommission(Number(item.total_amount_minor),Number(rule.rows[0].rate_basis_points),Number(rule.rows[0].fixed_minor));
          if (commission > 0) await client.query(`INSERT INTO affiliate_commissions(affiliate_id,referred_user_id,order_id,order_item_id,rule_id,amount_minor,currency)
            VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(order_item_id,affiliate_id) DO NOTHING`,
          [referral.rows[0].affiliate_id,referral.rows[0].referred_user_id,tx.order_id,item.id,rule.rows[0].id,commission,tx.currency]);
        }
      }
    }
    const invoiceNumber = `GIN-${new Date().getUTCFullYear()}-${String(order.rows[0].public_id).replace(/-/g,"").slice(0,12).toUpperCase()}`;
    await client.query("INSERT INTO invoices(order_id,invoice_number) VALUES($1,$2) ON CONFLICT(order_id) DO NOTHING", [tx.order_id,invoiceNumber]);
  } else if (nextStatus === "refunded") {
    await applyFullRefundEffects(client, {
      transactionId: Number(tx.id),
      orderId: Number(tx.order_id),
      providerRefundId: verified.refundReference?.trim() || verified.eventId,
      amountMinor: verified.amountMinor,
      currency: verified.currency,
    });
  } else {
    const orderStatus = nextStatus === "canceled" ? "canceled" : "failed";
    await client.query("UPDATE orders SET status=$1::varchar WHERE id=$2 AND (status<>'paid' OR $1::varchar='refunded')", [orderStatus,tx.order_id]);
  }

  await client.query("UPDATE payment_webhook_events SET status='processed',processed_at=NOW() WHERE id=$1", [eventId]);
  await client.query("INSERT INTO audit_logs(action,entity_type,entity_id,metadata) VALUES('payment_webhook_processed','payment_transaction',$1,$2::jsonb)",
    [tx.id,JSON.stringify({provider:providerName,eventId:verified.eventId,outcome:verified.outcome})]);
  return { processed: true as const, status: nextStatus };
}
