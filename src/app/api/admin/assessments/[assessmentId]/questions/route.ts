import { z } from "zod";
import { canManageCourse,getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const optionSchema=z.object({id:z.string().trim().min(1).max(40).regex(/^[a-zA-Z0-9_-]+$/),label:z.string().trim().min(1).max(500)});
const schema=z.object({questionType:z.enum(["single_choice","multiple_choice","true_false","short_text"]),prompt:z.string().trim().min(3).max(5000),options:z.array(optionSchema).max(20).default([]),answerKey:z.unknown().optional(),explanation:z.string().max(4000).default(""),points:z.number().positive().max(10000).default(1),position:z.number().int().min(0).max(10000).optional()});

export async function POST(request:Request,{params}:{params:Promise<{assessmentId:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await getSession();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);
  const id=Number((await params).assessmentId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("آزمون پیدا نشد.",404);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("اطلاعات سؤال معتبر نیست.");
  const {questionType,options,answerKey}=parsed.data;
  if(new Set(options.map((option)=>option.id)).size!==options.length)return errorResponse("شناسه گزینه‌ها باید یکتا باشد.");
  if(questionType==="single_choice"&&(!options.length||typeof answerKey!=="string"||!options.some((option)=>option.id===answerKey)))return errorResponse("سؤال تک‌گزینه‌ای باید گزینه درست معتبر داشته باشد.");
  if(questionType==="multiple_choice"&&(!options.length||!Array.isArray(answerKey)||!answerKey.length||answerKey.some((id)=>typeof id!=="string"||!options.some((option)=>option.id===id))))return errorResponse("پاسخ سؤال چندگزینه‌ای معتبر نیست.");
  if(questionType==="true_false"&&(typeof answerKey!=="boolean"||options.length))return errorResponse("سؤال درست/نادرست باید پاسخ بولی و بدون گزینه داشته باشد.");
  if(questionType==="short_text"&&(answerKey!==undefined||options.length))return errorResponse("پاسخ سؤال تشریحی به‌صورت دستی ارزیابی می‌شود.");
  try{await ensureSchema();const result=await inTransaction(async(client)=>{
    const assessment=await client.query("SELECT id,status,course_id FROM assessments WHERE id=$1 FOR UPDATE",[id]);if(!assessment.rowCount||assessment.rows[0].status!=="draft")return null;if(!(await canManageCourse(admin,Number(assessment.rows[0].course_id),client)))return {forbidden:true as const};
    const next=await client.query("SELECT COALESCE(MAX(position),-1)+1 AS next FROM assessment_questions WHERE assessment_id=$1",[id]);
    return (await client.query(`INSERT INTO assessment_questions(assessment_id,question_type,prompt,options,answer_key,explanation,points,position)
      VALUES($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7,$8) RETURNING id,question_type,prompt,options,points,position`,
    [id,questionType,parsed.data.prompt,JSON.stringify(options),JSON.stringify(answerKey??null),parsed.data.explanation,parsed.data.points,parsed.data.position??Number(next.rows[0].next)])).rows[0];
  });if(!result)return errorResponse("آزمون پیدا نشد یا پس از انتشار قابل ویرایش نیست.",409);if('forbidden'in result)return errorResponse("دسترسی مدیریت دوره ندارید.",403);return jsonResponse({question:result,message:"سؤال به بانک آزمون اضافه شد."},201);
  }catch{return errorResponse("افزودن سؤال انجام نشد.",503);}
}
