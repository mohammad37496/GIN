import { z } from "zod";
import { canManageFinance,getSession } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema=z.object({status:z.enum(["approved","rejected","paid"]),paidReference:z.string().trim().min(3).max(180).optional()});

export async function PATCH(request:Request,{params}:{params:Promise<{payoutId:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await getSession();if(!admin||!(await canManageFinance(admin)))return errorResponse("دسترسی مالی ندارید.",403);
  const id=Number((await params).payoutId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("درخواست تسویه پیدا نشد.",404);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("وضعیت تسویه معتبر نیست.");
  if(parsed.data.status==='paid'&&!parsed.data.paidReference)return errorResponse("برای ثبت تسویه پرداخت‌شده، شناسه حواله یا رسید لازم است.");
  try{
    await ensureSchema();
    const result=await inTransaction(async(client)=>{
      const payout=await client.query("SELECT * FROM affiliate_payouts WHERE id=$1 FOR UPDATE",[id]);
      if(!payout.rowCount)return null;
      const row=payout.rows[0];
      if(parsed.data.status==='paid'&&Number(row.approved_by)===admin.id)return {makerChecker:true as const};
      if(parsed.data.status==='approved'&&row.status!=='requested')return {conflict:true as const};
      if(parsed.data.status==='rejected'&&row.status!=='requested')return {conflict:true as const};
      if(parsed.data.status==='paid'&&row.status!=='approved')return {conflict:true as const};
      if(parsed.data.status==='rejected'){
        await client.query("UPDATE affiliate_payouts SET status='rejected',reviewed_by=$1,reviewed_at=NOW() WHERE id=$2",[admin.id,id]);
        await client.query(`INSERT INTO affiliate_wallet_entries(affiliate_id,payout_id,entry_type,amount_minor,currency,description)
          VALUES($1,$2,'reversal',$3,$4,'بازگشت مبلغ درخواست تسویه ردشده')`,[row.affiliate_id,id,row.amount_minor,row.currency]);
      }else if(parsed.data.status==='approved'){
        await client.query("UPDATE affiliate_payouts SET status='approved',reviewed_by=$1,reviewed_at=NOW(),approved_by=$1 WHERE id=$2",[admin.id,id]);
      }else{
        await client.query("UPDATE affiliate_payouts SET status='paid',paid_reference=$1,paid_reference_dedupe_enabled=TRUE,paid_at=NOW(),paid_by=$2 WHERE id=$3",[parsed.data.paidReference,admin.id,id]);
      }
      await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'affiliate_payout',$3,$4::jsonb)",
        [admin.id,`payout_${parsed.data.status}`,id,JSON.stringify({amountMinor:row.amount_minor,currency:row.currency,paidReference:parsed.data.paidReference??null})]);
      return {id,status:parsed.data.status};
    });
    if(!result)return errorResponse("درخواست تسویه پیدا نشد.",404);
    if('conflict'in result)return errorResponse("تغییر وضعیت تسویه با وضعیت فعلی سازگار نیست.",409);
    if('makerChecker'in result)return errorResponse("تأییدکننده درخواست نمی‌تواند خودش پرداخت نهایی را ثبت کند.",409);
    return jsonResponse({payout:result,message:"وضعیت درخواست تسویه ثبت شد."});
  }catch(error){
    if(typeof error==='object'&&error!==null&&'code'in error&&error.code==='23505')return errorResponse("شناسه حواله قبلاً برای درخواست دیگری ثبت شده است.",409);
    return errorResponse("بررسی درخواست تسویه انجام نشد.",503);
  }
}
