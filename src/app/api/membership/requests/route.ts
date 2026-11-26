import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema=z.object({planId:z.number().int().positive(),message:z.string().trim().max(1000).default("")});

export async function POST(request:Request){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const user=await getSession();if(!user)return errorResponse("برای درخواست عضویت وارد شوید.",401);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("اطلاعات درخواست عضویت معتبر نیست.");
  try{await ensureSchema();const result=await inTransaction(async(client)=>{
    const plan=await client.query("SELECT id,price_minor,billing_interval FROM membership_plans WHERE id=$1 AND is_active=TRUE FOR UPDATE",[parsed.data.planId]);
    if(!plan.rowCount)return {missing:true as const};
    if(Number(plan.rows[0].price_minor)!==0||plan.rows[0].billing_interval!=="none")return {paid:true as const};
    const active=await client.query("SELECT 1 FROM memberships WHERE user_id=$1 AND plan_id=$2 AND status='active' AND (ends_at IS NULL OR ends_at>NOW())",[user.id,parsed.data.planId]);
    if(active.rowCount)return {active:true as const};
    const requestRow=await client.query(`INSERT INTO membership_requests(user_id,plan_id,message) VALUES($1,$2,$3)
      ON CONFLICT(user_id,plan_id) WHERE status='pending' DO NOTHING RETURNING id,status`,[user.id,parsed.data.planId,parsed.data.message]);
    return requestRow.rowCount?{request:requestRow.rows[0]}:{duplicate:true as const};
  });
  if("missing" in result)return errorResponse("پلن فعال پیدا نشد.",404);
  if("paid" in result)return errorResponse("برای این پلن ابتدا باید پرداخت آنلاین فعال شود؛ هنوز هیچ وجهی دریافت نشده است.",409);
  if("active" in result)return jsonResponse({message:"این پلن هم‌اکنون برای شما فعال است."});
  if("duplicate" in result)return errorResponse("درخواست بررسی این پلن قبلاً ثبت شده است.",409);
  return jsonResponse({request:result.request,message:"درخواست عضویت برای بررسی مدیر ثبت شد."},201);
  }catch{return errorResponse("ثبت درخواست عضویت انجام نشد.",503);}
}
