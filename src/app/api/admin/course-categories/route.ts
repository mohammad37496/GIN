import { withApiErrorBoundary } from "@/lib/api-error-boundary";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
const schema=z.object({slug:z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),name:z.string().trim().min(2).max(140),nameEn:z.string().trim().max(140).default(""),description:z.string().max(2000).default(""),descriptionEn:z.string().max(2000).default(""),position:z.number().int().min(0).max(10000).default(0)});
async function GET(){const admin=await requireAdmin();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);try{await ensureSchema();const result=await pool.query("SELECT * FROM course_categories ORDER BY position,name");return jsonResponse({categories:result.rows});}catch{return errorResponse("دریافت دسته‌بندی‌ها انجام نشد.",503);}}
async function POST(request:Request){const originError=rejectCrossOriginMutation(request);if(originError)return originError;const admin=await requireAdmin();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("اطلاعات دسته‌بندی معتبر نیست.");try{await ensureSchema();const result=await pool.query("INSERT INTO course_categories(slug,name,name_en,description,description_en,position) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,slug,name,name_en",[parsed.data.slug,parsed.data.name,parsed.data.nameEn||null,parsed.data.description,parsed.data.descriptionEn||null,parsed.data.position]);await pool.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id) VALUES($1,'course_category_created','course_category',$2)",[admin.id,result.rows[0].id]);return jsonResponse({category:result.rows[0],message:"دسته‌بندی ایجاد شد."},201);}catch(error){if(typeof error==='object'&&error!==null&&'code'in error&&error.code==='23505')return errorResponse("نشانی دسته‌بندی تکراری است.",409);return errorResponse("ساخت دسته‌بندی انجام نشد.",503);}}

const wrappedGET = withApiErrorBoundary(GET);
const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedGET as GET, wrappedPOST as POST };
