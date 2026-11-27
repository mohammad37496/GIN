import { z } from "zod";
import { canManageCourse,getSession } from "@/lib/auth";
import { ensureSchema, inTransaction,pool } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


const schema = z.object({ title:z.string().trim().min(2).max(180),titleEn:z.string().trim().max(180).optional(),description:z.string().trim().max(4000).default(""),descriptionEn:z.string().trim().max(4000).optional(),timeLimitSeconds:z.number().int().min(0).max(86400).default(0),maxAttempts:z.number().int().min(1).max(100).default(1),passPercent:z.number().min(0).max(100).default(70),shuffleQuestions:z.boolean().default(false) });

 async function GET(_request:Request,{params}:{params:Promise<{courseId:string}>}){const user=await getSession();if(!user)return errorResponse("دسترسی غیرمجاز است.",403);const courseId=Number((await params).courseId);if(!Number.isSafeInteger(courseId)||courseId<1)return errorResponse("دوره پیدا نشد.",404);try{await ensureSchema();if(!(await canManageCourse(user,courseId)))return errorResponse("دسترسی مدیریت دوره ندارید.",403);const result=await pool.query(`SELECT a.id,a.title,a.title_en,a.description,a.description_en,a.status,a.time_limit_seconds,a.max_attempts,a.pass_percent,
  COUNT(q.id)::int AS question_count FROM assessments a LEFT JOIN assessment_questions q ON q.assessment_id=a.id
  WHERE a.course_id=$1 GROUP BY a.id ORDER BY a.created_at DESC`,[courseId]);return jsonResponse({assessments:result.rows});}catch{return errorResponse("دریافت آزمون‌های دوره انجام نشد.",503);}}

 async function POST(request:Request,{params}:{params:Promise<{courseId:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await getSession();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);
  const courseId=Number((await params).courseId);if(!Number.isSafeInteger(courseId)||courseId<1)return errorResponse("دوره پیدا نشد.",404);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("اطلاعات آزمون معتبر نیست.");
  try{await ensureSchema();const result=await inTransaction(async(client)=>{
    const course=await client.query("SELECT id FROM courses WHERE id=$1 FOR UPDATE",[courseId]);if(!course.rowCount)return null;if(!(await canManageCourse(admin,courseId,client)))return {forbidden:true as const};
    return (await client.query(`INSERT INTO assessments(course_id,title,title_en,description,description_en,time_limit_seconds,max_attempts,pass_percent,shuffle_questions,created_by)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id,title,title_en,status`,[courseId,parsed.data.title,parsed.data.titleEn||null,parsed.data.description,parsed.data.descriptionEn||null,parsed.data.timeLimitSeconds,parsed.data.maxAttempts,parsed.data.passPercent,parsed.data.shuffleQuestions,admin.id])).rows[0];
  });if(!result)return errorResponse("دوره پیدا نشد.",404);if('forbidden'in result)return errorResponse("دسترسی مدیریت دوره ندارید.",403);return jsonResponse({assessment:result,message:"آزمون به‌صورت پیش‌نویس ساخته شد."},201);
  }catch{return errorResponse("ساخت آزمون انجام نشد.",503);}
}


const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedPOST as POST };
