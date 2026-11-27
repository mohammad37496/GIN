import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


const schema=z.object({displayName:z.string().trim().max(120).default(""),email:z.union([z.string().trim().email().max(254),z.literal("")]).default(""),phone:z.string().trim().max(40).default(""),locale:z.enum(["fa","en"]).default("fa"),timezone:z.string().trim().min(1).max(80).default("Asia/Tehran")});

 async function GET(){const user=await getSession();if(!user)return errorResponse("ابتدا وارد شوید.",401);try{await ensureSchema();await pool.query("INSERT INTO user_profiles(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING",[user.id]);const result=await pool.query("SELECT display_name,email,email_verified_at,phone,locale,timezone,updated_at FROM user_profiles WHERE user_id=$1",[user.id]);return jsonResponse({profile:result.rows[0]});}catch{return errorResponse("دریافت پروفایل انجام نشد.",503);}}

 async function PUT(request:Request){const originError=rejectCrossOriginMutation(request);if(originError)return originError;const user=await getSession();if(!user)return errorResponse("ابتدا وارد شوید.",401);const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("اطلاعات پروفایل معتبر نیست.");try{await ensureSchema();const d=parsed.data;const result=await pool.query(`INSERT INTO user_profiles(user_id,display_name,email,phone,locale,timezone,updated_at)
  VALUES($1,$2,$3,$4,$5,$6,NOW()) ON CONFLICT(user_id) DO UPDATE SET display_name=EXCLUDED.display_name,email=EXCLUDED.email,email_verified_at=CASE WHEN LOWER(user_profiles.email) IS NOT DISTINCT FROM LOWER(EXCLUDED.email) THEN user_profiles.email_verified_at ELSE NULL END,phone=EXCLUDED.phone,locale=EXCLUDED.locale,timezone=EXCLUDED.timezone,updated_at=NOW()
  RETURNING display_name,email,email_verified_at,phone,locale,timezone,updated_at`,[user.id,d.displayName,d.email||null,d.phone||null,d.locale,d.timezone]);return jsonResponse({profile:result.rows[0],message:"پروفایل به‌روزرسانی شد."});}catch(error){if(typeof error==='object'&&error!==null&&'code'in error&&error.code==='23505')return errorResponse("این ایمیل قبلاً برای حساب دیگری ثبت شده است.",409);return errorResponse("ذخیره پروفایل انجام نشد.",503);}}


const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
const wrappedPUT = withApiErrorBoundary(PUT);
export { wrappedPUT as PUT };
