import { ensureSchema,inTransaction } from "@/lib/db";
import { getConfiguredPaymentProvider } from "@/lib/payments/provider";
import { errorResponse,jsonResponse } from "@/lib/http";
import { calculateCommission,isAllowedPaymentTransition } from "@/lib/domain";
import { applyFullRefundEffects } from "@/lib/payments/refunds";

export async function POST(request:Request,{params}:{params:Promise<{provider:string}>}){
  const {provider:providerName}=await params;
  const provider=getConfiguredPaymentProvider();
  if(!provider||provider.name!==providerName.toLowerCase())return errorResponse("درگاه پرداخت برای دریافت webhook فعال نیست.",503);
  try{
    const rawBody=await request.text();
    const verified=await provider.verifyWebhook(request,rawBody);
    await ensureSchema();
    const result=await inTransaction(async(client)=>{
      const inserted=await client.query(`INSERT INTO payment_webhook_events(provider,provider_event_id,event_type,payload)
        VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(provider,provider_event_id) DO NOTHING RETURNING id`,
      [provider.name,verified.eventId,verified.eventType,JSON.stringify({transactionReference:verified.transactionReference,outcome:verified.outcome,amountMinor:verified.amountMinor,currency:verified.currency})]);
      if(!inserted.rowCount)return {duplicate:true as const};

      const transaction=await client.query("SELECT * FROM payment_transactions WHERE provider=$1 AND provider_reference=$2 FOR UPDATE",[provider.name,verified.transactionReference]);
      if(!transaction.rowCount){
        await client.query("UPDATE payment_webhook_events SET status='ignored',processed_at=NOW() WHERE id=$1",[inserted.rows[0].id]);
        return {ignored:true as const};
      }
      const tx=transaction.rows[0];
      if(Number(tx.amount_minor)!==verified.amountMinor||tx.currency!==verified.currency){
        await client.query("UPDATE payment_webhook_events SET status='failed',processed_at=NOW() WHERE id=$1",[inserted.rows[0].id]);
        return {mismatch:true as const};
      }
      const nextStatus=verified.outcome==='succeeded'?'succeeded':verified.outcome==='failed'?'failed':verified.outcome==='canceled'?'canceled':'refunded';
      if(tx.status===nextStatus){
        await client.query("UPDATE payment_webhook_events SET status='processed',processed_at=NOW() WHERE id=$1",[inserted.rows[0].id]);
        return {duplicate:true as const};
      }
      if(!isAllowedPaymentTransition(tx.status,nextStatus)){
        await client.query("UPDATE payment_webhook_events SET status='ignored',processed_at=NOW() WHERE id=$1",[inserted.rows[0].id]);
        return {invalidTransition:true as const};
      }
      await client.query(`UPDATE payment_transactions SET status=$1::varchar,updated_at=NOW(),
        succeeded_at=CASE WHEN $1::varchar='succeeded' THEN NOW() ELSE succeeded_at END WHERE id=$2`,[nextStatus,tx.id]);

      if(nextStatus==='succeeded'){
        await client.query("UPDATE orders SET status='paid',paid_at=NOW() WHERE id=$1 AND status='pending'",[tx.order_id]);
        const order=await client.query("SELECT public_id,user_id FROM orders WHERE id=$1",[tx.order_id]);
        const items=await client.query("SELECT * FROM order_items WHERE order_id=$1",[tx.order_id]);
        for(const item of items.rows){
          if(item.item_type==='course'){
            await client.query(`INSERT INTO course_enrollments(course_id,user_id,status,source,source_order_id)
              VALUES($1,$2,'active','purchase',$3) ON CONFLICT(course_id,user_id) DO UPDATE SET
                status=CASE WHEN course_enrollments.status='revoked' THEN 'active' ELSE course_enrollments.status END,
                source='purchase',source_order_id=EXCLUDED.source_order_id,expires_at=NULL
              WHERE course_enrollments.status='revoked' OR course_enrollments.source='subscription'`,
            [item.item_id,order.rows[0].user_id,tx.order_id]);
          }else if(item.item_type==='membership'){
            const plan=await client.query("SELECT billing_interval FROM membership_plans WHERE id=$1",[item.item_id]);
            const interval=plan.rows[0]?.billing_interval;
            const intervalValue=interval==='month'?'1 month':interval==='year'?'1 year':null;
            await client.query(`INSERT INTO memberships(user_id,plan_id,status,starts_at,ends_at,source,provider,source_order_id)
              VALUES($1,$2,'active',NOW(),CASE WHEN $3::text IS NULL THEN NULL ELSE NOW()+$3::interval END,'payment',$4,$5)`,
            [order.rows[0].user_id,item.item_id,intervalValue,provider.name,tx.order_id]);
          }else if(item.item_type==='event'){
            const event=await client.query("SELECT id,capacity FROM events WHERE id=$1 AND status='published' FOR UPDATE",[item.item_id]);
            if(event.rowCount){
              const count=await client.query("SELECT COUNT(*)::int AS count FROM event_registrations WHERE event_id=$1 AND status='registered'",[item.item_id]);
              const status=event.rows[0].capacity!==null&&count.rows[0].count>=event.rows[0].capacity?'waitlisted':'registered';
              await client.query("INSERT INTO event_registrations(event_id,user_id,status,order_id) VALUES($1,$2,$3,$4) ON CONFLICT(event_id,user_id) DO NOTHING",[item.item_id,order.rows[0].user_id,status,tx.order_id]);
            }
          }
          const referral=await client.query(`SELECT ra.affiliate_id,ra.referred_user_id FROM referral_attributions ra
            JOIN affiliate_accounts aa ON aa.id=ra.affiliate_id AND aa.status='active'
            WHERE ra.referred_user_id=$1`,[order.rows[0].user_id]);
          if(referral.rowCount){
            const rule=await client.query(`SELECT * FROM commission_rules WHERE item_type=$1 AND is_active=TRUE AND starts_at<=NOW()
              AND (ends_at IS NULL OR ends_at>NOW()) AND (currency IS NULL OR currency=$2) ORDER BY starts_at DESC LIMIT 1`,[item.item_type,tx.currency]);
            if(rule.rowCount){
              const commission=calculateCommission(Number(item.total_amount_minor),Number(rule.rows[0].rate_basis_points),Number(rule.rows[0].fixed_minor));
              if(commission>0)await client.query(`INSERT INTO affiliate_commissions(affiliate_id,referred_user_id,order_id,order_item_id,rule_id,amount_minor,currency)
                VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(order_item_id,affiliate_id) DO NOTHING`,
              [referral.rows[0].affiliate_id,referral.rows[0].referred_user_id,tx.order_id,item.id,rule.rows[0].id,commission,tx.currency]);
            }
          }
        }
        const invoiceNumber=`GIN-${new Date().getUTCFullYear()}-${String(order.rows[0].public_id).replace(/-/g,'').slice(0,12).toUpperCase()}`;
        await client.query("INSERT INTO invoices(order_id,invoice_number) VALUES($1,$2) ON CONFLICT(order_id) DO NOTHING",[tx.order_id,invoiceNumber]);
      }else if(nextStatus==='refunded'){
        await applyFullRefundEffects(client,{
          transactionId:Number(tx.id),
          orderId:Number(tx.order_id),
          providerRefundId:verified.refundReference?.trim()||verified.eventId,
          amountMinor:verified.amountMinor,
          currency:verified.currency,
        });
      }else{
        const orderStatus=nextStatus==='canceled'?'canceled':'failed';
        await client.query("UPDATE orders SET status=$1::varchar WHERE id=$2 AND (status<>'paid' OR $1::varchar='refunded')",[orderStatus,tx.order_id]);
      }

      await client.query("UPDATE payment_webhook_events SET status='processed',processed_at=NOW() WHERE id=$1",[inserted.rows[0].id]);
      await client.query("INSERT INTO audit_logs(action,entity_type,entity_id,metadata) VALUES('payment_webhook_processed','payment_transaction',$1,$2::jsonb)",
      [tx.id,JSON.stringify({provider:provider.name,eventId:verified.eventId,outcome:verified.outcome})]);
      return {processed:true,status:nextStatus};
    });
    if('duplicate'in result)return jsonResponse({received:true,duplicate:true});
    if('ignored'in result)return jsonResponse({received:true,ignored:true});
    if('invalidTransition'in result)return errorResponse("تغییر وضعیت تراکنش با چرخه مجاز پرداخت سازگار نیست.",409);
    if('mismatch'in result)return errorResponse("مبلغ یا ارز webhook با تراکنش مطابقت ندارد.",400);
    return jsonResponse({received:true,...result});
  }catch{return errorResponse("اعتبارسنجی یا پردازش webhook انجام نشد.",400);}
}
