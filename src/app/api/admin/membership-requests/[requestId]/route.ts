import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { lockMembershipUser,reconcileMembershipEntitlements } from "@/lib/membership";

const schema=z.object({status:z.enum(["approved","rejected"]),reason:z.string().trim().max(500).default("")});

export async function PATCH(request:Request,{params}:{params:Promise<{requestId:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await requireAdmin();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);
  const id=Number((await params).requestId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("درخواست پیدا نشد.",404);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("وضعیت درخواست معتبر نیست.");
  try{
    await ensureSchema();
    const result=await inTransaction(async(client)=>{
      const req=await client.query(`SELECT r.*,p.price_minor,p.billing_interval FROM membership_requests r
        JOIN membership_plans p ON p.id=r.plan_id WHERE r.id=$1 FOR UPDATE OF r`,[id]);
      if(!req.rowCount||req.rows[0].status!=="pending")return null;
      const row=req.rows[0];
      if(parsed.data.status==='approved'&&(Number(row.price_minor)!==0||row.billing_interval!=="none"))return {paid:true as const};
      let membershipId:number|null=null;
      if(parsed.data.status==='approved'){
        await lockMembershipUser(client,Number(row.user_id));
        const member=await client.query("SELECT status FROM users WHERE id=$1 FOR UPDATE",[row.user_id]);
        if(!member.rowCount||member.rows[0].status!=="approved")return {inactive:true as const};
        const membership=await client.query(`INSERT INTO memberships(user_id,plan_id,status,starts_at,source,created_by)
          VALUES($1,$2,'active',NOW(),'admin',$3) RETURNING id`,[row.user_id,row.plan_id,admin.id]);
        membershipId=Number(membership.rows[0].id);
        await reconcileMembershipEntitlements(client,Number(row.user_id),admin.id);
        await client.query("INSERT INTO notifications(user_id,type,title,body,href) VALUES($1,'membership_activated','عضویت فعال شد','درخواست عضویت شما تأیید شد.','/dashboard')",[row.user_id]);
      }
      await client.query("UPDATE membership_requests SET status=$1,reviewed_by=$2,reviewed_at=NOW() WHERE id=$3",[parsed.data.status,admin.id,id]);
      await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'membership_request',$3,$4::jsonb)",
        [admin.id,`membership_request_${parsed.data.status}`,id,JSON.stringify({membershipId,reason:parsed.data.reason})]);
      return {status:parsed.data.status,membershipId};
    });
    if(!result)return errorResponse("درخواست در انتظار بررسی پیدا نشد.",404);
    if("paid" in result)return errorResponse("درخواست پلن پولی بدون پرداخت قابل تأیید نیست.",409);
    if("inactive" in result)return errorResponse("حساب عضو فعال نیست.",409);
    return jsonResponse({result,message:"درخواست عضویت بررسی شد."});
  }catch{return errorResponse("بررسی درخواست عضویت انجام نشد.",503);}
}
