import { z } from "zod";
import { canManageAffiliates,getSession } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";

const schema=z.object({status:z.enum(["approved","rejected"])});
 async function PATCH(request:Request,{params}:{params:Promise<{commissionId:string}>}){const originError=rejectCrossOriginMutation(request);if(originError)return originError;const admin=await getSession();if(!admin||!(await canManageAffiliates(admin)))return errorResponse("دسترسی مالی یا همکاری در فروش ندارید.",403);const id=Number((await params).commissionId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("کمیسیون پیدا نشد.",404);const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("وضعیت کمیسیون معتبر نیست.");try{await ensureSchema();const result=await inTransaction(async(client)=>{const commission=await client.query("SELECT * FROM affiliate_commissions WHERE id=$1 FOR UPDATE",[id]);if(!commission.rowCount||commission.rows[0].status!=='pending')return null;const row=commission.rows[0];await client.query("UPDATE affiliate_commissions SET status=$1::varchar WHERE id=$2",[parsed.data.status==='approved'?'available':'rejected',id]);if(parsed.data.status==='approved'&&Number(row.amount_minor)>0)await client.query(`INSERT INTO affiliate_wallet_entries(affiliate_id,commission_id,entry_type,amount_minor,currency,description)
  VALUES($1,$2,'credit',$3,$4,'کمیسیون تأییدشده') ON CONFLICT(commission_id) WHERE commission_id IS NOT NULL AND entry_type='credit' DO NOTHING`,[row.affiliate_id,id,row.amount_minor,row.currency]);await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'affiliate_commission',$3,$4::jsonb)",[admin.id,`commission_${parsed.data.status}`,id,JSON.stringify({amountMinor:row.amount_minor,currency:row.currency})]);return {id,status:parsed.data.status};});if(!result)return errorResponse("کمیسیون در انتظار بررسی پیدا نشد.",409);return jsonResponse({commission:result,message:"وضعیت کمیسیون ثبت شد."});}catch{return errorResponse("بررسی کمیسیون انجام نشد.",503);}}


const wrappedPATCH = withApiErrorBoundary(PATCH);
export { wrappedPATCH as PATCH };
