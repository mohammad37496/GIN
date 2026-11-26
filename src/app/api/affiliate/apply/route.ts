import { randomBytes } from "node:crypto";
import { getSession } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

export async function POST(request:Request){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const user=await getSession();if(!user)return errorResponse("برای درخواست همکاری در فروش وارد شوید.",401);
  try{
    await ensureSchema();
    const result=await inTransaction(async(client)=>{
      await client.query("SELECT id FROM users WHERE id=$1 FOR UPDATE",[user.id]);
      const existing=await client.query("SELECT referral_code,status FROM affiliate_accounts WHERE user_id=$1",[user.id]);
      if(existing.rowCount)return {affiliate:existing.rows[0],created:false as const};
      const code=randomBytes(6).toString("hex").toUpperCase();
      const created=await client.query("INSERT INTO affiliate_accounts(user_id,referral_code,status) VALUES($1,$2,'pending') RETURNING referral_code,status",[user.id,code]);
      await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id) VALUES($1,'affiliate_application','user',$1)",[user.id]);
      return {affiliate:created.rows[0],created:true as const};
    });
    return jsonResponse({affiliate:result.affiliate,message:result.created?"درخواست همکاری در فروش برای بررسی ثبت شد.":"درخواست همکاری شما قبلاً ثبت شده است."},result.created?201:200);
  }catch{return errorResponse("ثبت درخواست همکاری انجام نشد.",503);}
}
