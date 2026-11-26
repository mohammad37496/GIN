import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema=z.object({status:z.enum(["canceled","expired"]),reason:z.string().trim().max(500).default("")});

export async function PATCH(request:Request,{params}:{params:Promise<{membershipId:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await requireAdmin();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);
  const id=Number((await params).membershipId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("عضویت پیدا نشد.",404);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("وضعیت عضویت معتبر نیست.");
  try{await ensureSchema();const result=await inTransaction(async(client)=>{
    const membership=await client.query("SELECT id,user_id,plan_id,status FROM memberships WHERE id=$1 FOR UPDATE",[id]);
    if(!membership.rowCount||!["active","pending","past_due"].includes(membership.rows[0].status))return null;
    const row=membership.rows[0];
    await client.query("UPDATE memberships SET status=$1,canceled_at=NOW(),cancel_reason=$2,updated_at=NOW() WHERE id=$3",[parsed.data.status,parsed.data.reason,id]);
    const grants=await client.query("SELECT course_id FROM membership_plan_courses WHERE plan_id=$1",[row.plan_id]);
    for(const grant of grants.rows){
      const other=await client.query(`SELECT 1 FROM memberships m JOIN membership_plan_courses pc ON pc.plan_id=m.plan_id
        WHERE m.user_id=$1 AND pc.course_id=$2 AND m.id<>$3 AND m.status='active' AND m.starts_at<=NOW() AND (m.ends_at IS NULL OR m.ends_at>NOW()) LIMIT 1`,[row.user_id,grant.course_id,id]);
      if(!other.rowCount)await client.query("UPDATE course_enrollments SET status='revoked' WHERE course_id=$1 AND user_id=$2 AND source='subscription' AND status IN ('active','completed')",[grant.course_id,row.user_id]);
    }
    await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'membership',$3,$4::jsonb)",[admin.id,`membership_${parsed.data.status}`,id,JSON.stringify({userId:row.user_id,reason:parsed.data.reason})]);
    return {id,status:parsed.data.status};
  });
    if(!result)return errorResponse("عضویت فعال یا در انتظار پیدا نشد.",404);
    return jsonResponse({membership:result,message:"وضعیت عضویت تغییر کرد و دسترسی‌های وابسته بازبینی شد."});
  }catch{return errorResponse("تغییر وضعیت عضویت انجام نشد.",503);}
}
