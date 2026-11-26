import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema,inTransaction,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { lockMembershipUser,reconcileMembershipEntitlements } from "@/lib/membership";

const schema=z.object({userId:z.number().int().positive(),planId:z.number().int().positive(),startsAt:z.string().datetime().optional(),endsAt:z.string().datetime().nullable().optional(),reason:z.string().trim().max(500).default("اعطای دستی توسط مدیر")});

export async function GET(){
  const admin=await requireAdmin();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);
  try{await ensureSchema();const result=await pool.query(`SELECT m.id,m.status,m.starts_at,m.ends_at,m.source,m.created_at,u.id AS user_id,u.username,p.name AS plan_name,p.level
    FROM memberships m JOIN users u ON u.id=m.user_id JOIN membership_plans p ON p.id=m.plan_id ORDER BY m.created_at DESC LIMIT 500`);return jsonResponse({memberships:result.rows});}
  catch{return errorResponse("دریافت عضویت‌ها ممکن نشد.",503);}
}

export async function POST(request:Request){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await requireAdmin();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("اطلاعات اعطای عضویت معتبر نیست.");
  const d=parsed.data;const startsAt=d.startsAt?new Date(d.startsAt):new Date();const endsAt=d.endsAt?new Date(d.endsAt):null;
  if(endsAt&&endsAt<=startsAt)return errorResponse("تاریخ پایان باید پس از تاریخ شروع باشد.");
  try{
    await ensureSchema();
    const result=await inTransaction(async(client)=>{
      await lockMembershipUser(client,d.userId);
      const member=await client.query("SELECT id,status FROM users WHERE id=$1 FOR UPDATE",[d.userId]);
      if(!member.rowCount||member.rows[0].status!=="approved")return {member:false as const};
      const plan=await client.query("SELECT id FROM membership_plans WHERE id=$1 AND is_active=TRUE FOR UPDATE",[d.planId]);
      if(!plan.rowCount)return {plan:false as const};
      const existing=await client.query("SELECT id FROM memberships WHERE user_id=$1 AND plan_id=$2 AND status IN ('active','pending') AND (ends_at IS NULL OR ends_at>NOW())",[d.userId,d.planId]);
      if(existing.rowCount)return {duplicate:true as const};
      const membership=await client.query(`INSERT INTO memberships(user_id,plan_id,status,starts_at,ends_at,source,created_by)
        VALUES($1,$2,$3,$4,$5,'admin',$6) RETURNING id,status,starts_at,ends_at`,
      [d.userId,d.planId,startsAt>new Date()?"pending":"active",startsAt.toISOString(),endsAt?.toISOString()??null,admin.id]);
      if(membership.rows[0].status==="active")await reconcileMembershipEntitlements(client,d.userId,admin.id);
      await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,'membership_granted','membership',$2,$3::jsonb)",
        [admin.id,membership.rows[0].id,JSON.stringify({userId:d.userId,planId:d.planId,reason:d.reason})]);
      await client.query("INSERT INTO notifications(user_id,type,title,body,href) VALUES($1,'membership_activated',$2,$3,'/dashboard')",
        [d.userId,membership.rows[0].status==="active"?"عضویت فعال شد":"عضویت زمان‌بندی شد",membership.rows[0].status==="active"?"پلن عضویت شما فعال شد.":"عضویت شما از تاریخ تعیین‌شده فعال خواهد شد."]);
      return {membership:membership.rows[0]};
    });
    if("member" in result)return errorResponse("کاربر فعال و تأییدشده پیدا نشد.",404);
    if("plan" in result)return errorResponse("پلن فعال پیدا نشد.",404);
    if("duplicate" in result)return errorResponse("این عضویت هم‌اکنون فعال یا زمان‌بندی شده است.",409);
    return jsonResponse({membership:result.membership,message:"عضویت به‌صورت دستی و با ثبت حسابرسی اعطا شد."},201);
  }catch{return errorResponse("اعطای عضویت انجام نشد.",503);}
}
