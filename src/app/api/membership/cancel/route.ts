import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { lockMembershipUser,reconcileMembershipEntitlements,syncMembershipState } from "@/lib/membership";

const schema=z.object({membershipId:z.number().int().positive()});

export async function POST(request:Request){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const user=await getSession();if(!user)return errorResponse("ابتدا وارد شوید.",401);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("شناسه عضویت معتبر نیست.");
  try{
    await ensureSchema();await syncMembershipState(user.id);
    const result=await inTransaction(async(client)=>{
      await lockMembershipUser(client,user.id);
      const membership=await client.query(`SELECT m.id,m.plan_id,m.status,m.ends_at,p.price_minor FROM memberships m
        JOIN membership_plans p ON p.id=m.plan_id WHERE m.id=$1 AND m.user_id=$2 FOR UPDATE OF m`,[parsed.data.membershipId,user.id]);
      if(!membership.rowCount||membership.rows[0].status!=='active')return null;
      const row=membership.rows[0];
      if(Number(row.price_minor)>0){
        await client.query("UPDATE memberships SET cancel_at_period_end=TRUE,updated_at=NOW() WHERE id=$1",[row.id]);
        await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id) VALUES($1,'membership_cancel_scheduled','membership',$2)",[user.id,row.id]);
        return {status:'scheduled',endsAt:row.ends_at};
      }
      await client.query("UPDATE memberships SET status='canceled',canceled_at=NOW(),cancel_reason='Canceled by member',updated_at=NOW() WHERE id=$1",[row.id]);
      await reconcileMembershipEntitlements(client,user.id,user.id);
      await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id) VALUES($1,'membership_canceled_by_member','membership',$2)",[user.id,row.id]);
      return {status:'canceled',endsAt:null};
    });
    if(!result)return errorResponse("عضویت فعال پیدا نشد.",404);
    return jsonResponse({result,message:result.status==='scheduled'?"لغو عضویت در پایان دوره جاری زمان‌بندی شد.":"عضویت لغو و دسترسی‌های وابسته بازبینی شد."});
  }catch{return errorResponse("لغو عضویت انجام نشد.",503);}
}
