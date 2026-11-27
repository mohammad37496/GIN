import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema,inTransaction,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { grantAdminMembership } from "@/lib/admin-membership-grant";

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
    const result=await inTransaction((client)=>grantAdminMembership(client,{userId:d.userId,planId:d.planId,startsAt,endsAt,actorId:admin.id,reason:d.reason}));
    if("member" in result)return errorResponse("کاربر فعال و تأییدشده پیدا نشد.",404);
    if("plan" in result)return errorResponse("پلن فعال پیدا نشد.",404);
    if("duplicate" in result)return errorResponse("این عضویت هم‌اکنون فعال یا زمان‌بندی شده است.",409);
    return jsonResponse({membership:result.membership,message:"عضویت به‌صورت دستی و با ثبت حسابرسی اعطا شد."},201);
  }catch{return errorResponse("اعطای عضویت انجام نشد.",503);}
}
