import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { lockMembershipUser,reconcileMembershipEntitlements,syncMembershipState } from "@/lib/membership";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


const schema=z.object({planId:z.number().int().positive()});

 async function POST(request:Request){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const user=await getSession();if(!user)return errorResponse("ابتدا وارد شوید.",401);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("پلن انتخاب‌شده معتبر نیست.");
  try{
    await ensureSchema();await syncMembershipState(user.id);
    const result=await inTransaction(async(client)=>{
      await lockMembershipUser(client,user.id);
      const plan=await client.query("SELECT * FROM membership_plans WHERE id=$1 AND is_active=TRUE FOR UPDATE",[parsed.data.planId]);
      if(!plan.rowCount)return {missing:true as const};
      const next=plan.rows[0];
      if(Number(next.price_minor)>0)return {payment:true as const};
      const current=await client.query(`SELECT m.id,m.plan_id,p.level,p.price_minor FROM memberships m
        JOIN membership_plans p ON p.id=m.plan_id WHERE m.user_id=$1 AND m.status='active'
          AND (m.starts_at IS NULL OR m.starts_at<=NOW()) AND (m.ends_at IS NULL OR m.ends_at>NOW()) FOR UPDATE OF m`,[user.id]);
      if(!current.rowCount)return {noMembership:true as const};
      if(current.rows.some(row=>Number(row.plan_id)===Number(next.id)))return {same:true as const};
      if(current.rows.some(row=>Number(row.price_minor)>0))return {paidCurrent:true as const};
      const currentLevel=Math.max(...current.rows.map(row=>Number(row.level)));
      const changeType=Number(next.level)>currentLevel?'upgrade':Number(next.level)<currentLevel?'downgrade':'change';
      for(const old of current.rows){
        await client.query("UPDATE memberships SET status='canceled',canceled_at=NOW(),cancel_reason='Member changed membership plan',updated_at=NOW() WHERE id=$1",[old.id]);
      }
      const created=await client.query(`INSERT INTO memberships(user_id,plan_id,status,starts_at,source,created_by)
        VALUES($1,$2,'active',NOW(),'member_change',$1) RETURNING id,status,starts_at`,[user.id,next.id]);
      await reconcileMembershipEntitlements(client,user.id,user.id);
      await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,'membership_plan_changed','membership',$2,$3::jsonb)",
        [user.id,created.rows[0].id,JSON.stringify({from:current.rows.map(row=>row.plan_id),to:next.id,changeType})]);
      await client.query("INSERT INTO notifications(user_id,type,title,body,href) VALUES($1,'membership_changed','سطح عضویت تغییر کرد',$2,'/dashboard')",
        [user.id,`پلن عضویت شما به «${next.name}» تغییر کرد.`]);
      return {membership:created.rows[0],changeType,planName:next.name};
    });
    if('missing'in result)return errorResponse("پلن فعال پیدا نشد.",404);
    if('payment'in result)return errorResponse("تغییر به پلن پولی تا اتصال درگاه پرداخت ممکن نیست.",409);
    if('noMembership'in result)return errorResponse("برای تغییر سطح، ابتدا باید عضویت فعالی داشته باشید.",409);
    if('same'in result)return errorResponse("این پلن در حال حاضر فعال است.",409);
    if('paidCurrent'in result)return errorResponse("تغییر یا تنزل پلن پولی باید از طریق مدیریت اشتراک درگاه انجام شود.",409);
    return jsonResponse({result,message:`عضویت شما به پلن «${result.planName}» تغییر کرد.`});
  }catch(error){console.error("Membership plan change failed",error);return errorResponse("تغییر سطح عضویت انجام نشد.",503);}
}


const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedPOST as POST };
