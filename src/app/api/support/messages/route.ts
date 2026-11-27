import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { enforceRateLimit,rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


const schema=z.object({subject:z.string().trim().min(3).max(180),message:z.string().trim().min(10).max(10000)});
 async function GET(){const user=await getSession();if(!user)return errorResponse("ابتدا وارد شوید.",401);try{await ensureSchema();const result=await pool.query(`SELECT sm.id,sm.subject,sm.message,sm.status,sm.created_at,sm.updated_at,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('id',sr.id,'is_staff',sr.is_staff,'body',sr.body,'created_at',sr.created_at) ORDER BY sr.created_at)
    FROM support_replies sr WHERE sr.message_id=sm.id),'[]'::jsonb) AS replies
  FROM support_messages sm WHERE sm.user_id=$1 ORDER BY sm.created_at DESC LIMIT 100`,[user.id]);return jsonResponse({messages:result.rows});}catch{return errorResponse("دریافت درخواست‌های پشتیبانی انجام نشد.",503);}}
 async function POST(request:Request){const originError=rejectCrossOriginMutation(request);if(originError)return originError;const user=await getSession();if(!user)return errorResponse("برای ارسال پیام وارد شوید.",401);try{const limited=await enforceRateLimit(request,"support-message",5,3600);if(limited)return limited;const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("موضوع یا متن پیام معتبر نیست.");await ensureSchema();const result=await pool.query("INSERT INTO support_messages(user_id,subject,message) VALUES($1,$2,$3) RETURNING id,subject,status,created_at",[user.id,parsed.data.subject,parsed.data.message]);return jsonResponse({message:result.rows[0],notice:"درخواست شما برای تیم پشتیبانی ثبت شد."},201);}catch{return errorResponse("ارسال پیام پشتیبانی انجام نشد.",503);}}


const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedPOST as POST };
