import { z } from "zod";
import { canManageCourse,getSession } from "@/lib/auth";
import { ensureSchema, inTransaction, pool } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


const optionSchema=z.object({id:z.string().trim().min(1).max(40).regex(/^[a-zA-Z0-9_-]+$/),label:z.string().trim().min(1).max(500),label_en:z.string().trim().max(500).optional()});
const schema=z.object({questionType:z.enum(["single_choice","multiple_choice","true_false","short_text"]),prompt:z.string().trim().min(3).max(5000),promptEn:z.string().trim().max(5000).optional(),options:z.array(optionSchema).max(20).default([]),answerKey:z.unknown().optional(),explanation:z.string().max(4000).default(""),explanationEn:z.string().max(4000).optional(),points:z.number().positive().max(10000).default(1),position:z.number().int().min(0).max(10000).optional()});
const translationPatchSchema=z.object({promptEn:z.string().trim().max(5000).optional(),explanationEn:z.string().max(4000).optional(),optionTranslations:z.array(z.object({id:z.string().trim().min(1).max(40).regex(/^[a-zA-Z0-9_-]+$/),labelEn:z.string().trim().max(500)})).max(20).optional()}).refine((value)=>Object.keys(value).length>0);

 async function GET(_request:Request,{params}:{params:Promise<{assessmentId:string}>}){
  const admin=await getSession();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);
  const id=Number((await params).assessmentId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("آزمون پیدا نشد.",404);
  try{await ensureSchema();const assessment=await pool.query("SELECT course_id FROM assessments WHERE id=$1",[id]);if(!assessment.rowCount)return errorResponse("آزمون پیدا نشد.",404);if(!(await canManageCourse(admin,Number(assessment.rows[0].course_id))))return errorResponse("دسترسی مدیریت دوره ندارید.",403);
    const questions=await pool.query("SELECT id,question_type,prompt,prompt_en,options,answer_key,explanation,explanation_en,points,position FROM assessment_questions WHERE assessment_id=$1 ORDER BY position",[id]);return jsonResponse({questions:questions.rows});
  }catch{return errorResponse("دریافت سؤال‌های آزمون انجام نشد.",503);}
}

 async function POST(request:Request,{params}:{params:Promise<{assessmentId:string}>}){
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
    return (await client.query(`INSERT INTO assessment_questions(assessment_id,question_type,prompt,prompt_en,options,answer_key,explanation,explanation_en,points,position)
      VALUES($1,$2,$3,$4,$5::jsonb,$6::jsonb,$7,$8,$9,$10) RETURNING id,question_type,prompt,prompt_en,options,points,position`,
    [id,questionType,parsed.data.prompt,parsed.data.promptEn||null,JSON.stringify(options),JSON.stringify(answerKey??null),parsed.data.explanation,parsed.data.explanationEn||null,parsed.data.points,parsed.data.position??Number(next.rows[0].next)])).rows[0];
  });if(!result)return errorResponse("آزمون پیدا نشد یا پس از انتشار قابل ویرایش نیست.",409);if('forbidden'in result)return errorResponse("دسترسی مدیریت دوره ندارید.",403);return jsonResponse({question:result,message:"سؤال به بانک آزمون اضافه شد."},201);
  }catch{return errorResponse("افزودن سؤال انجام نشد.",503);}
}

 async function PATCH(request:Request,{params}:{params:Promise<{assessmentId:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await getSession();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);
  const id=Number((await params).assessmentId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("سؤال پیدا نشد.",404);
  const questionId=Number(new URL(request.url).searchParams.get("questionId"));if(!Number.isSafeInteger(questionId)||questionId<1)return errorResponse("شناسه سؤال معتبر نیست.");
  const parsed=translationPatchSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("ترجمه سؤال معتبر نیست.");
  try{await ensureSchema();const result=await inTransaction(async(client)=>{
    const assessment=await client.query("SELECT id,course_id FROM assessments WHERE id=$1 FOR UPDATE",[id]);if(!assessment.rowCount)return null;if(!(await canManageCourse(admin,Number(assessment.rows[0].course_id),client)))return {forbidden:true as const};
    const current=await client.query("SELECT options FROM assessment_questions WHERE id=$1 AND assessment_id=$2 FOR UPDATE",[questionId,id]);if(!current.rowCount)return null;
    let options=current.rows[0].options;
    if(parsed.data.optionTranslations){
      const translations=new Map(parsed.data.optionTranslations.map((item)=>[item.id,item.labelEn]));
      options=(Array.isArray(options)?options:[]).map((option:Record<string,unknown>)=>{
        if(!translations.has(String(option.id)))return option;
        const labelEn=translations.get(String(option.id));
        if(!labelEn){const preserved={...option};delete preserved.label_en;return preserved;}
        return {...option,label_en:labelEn};
      });
    }
    const updated=await client.query(`UPDATE assessment_questions SET
      prompt_en=CASE WHEN $3::boolean THEN NULLIF($4,'') ELSE prompt_en END,
      explanation_en=CASE WHEN $5::boolean THEN NULLIF($6,'') ELSE explanation_en END,
      options=$7::jsonb WHERE id=$1 AND assessment_id=$2
      RETURNING id,prompt,prompt_en,options,explanation,explanation_en`,
    [questionId,id,Object.hasOwn(parsed.data,"promptEn"),parsed.data.promptEn??"",Object.hasOwn(parsed.data,"explanationEn"),parsed.data.explanationEn??"",JSON.stringify(options)]);
    return updated.rows[0]??null;
  });if(!result)return errorResponse("سؤال پیدا نشد.",404);if("forbidden" in result)return errorResponse("دسترسی مدیریت دوره ندارید.",403);return jsonResponse({question:result,message:"ترجمه سؤال ذخیره شد."});
  }catch{return errorResponse("ذخیره ترجمه سؤال انجام نشد.",503);}
}


const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedPOST as POST };
const wrappedPATCH = withApiErrorBoundary(PATCH);
export { wrappedPATCH as PATCH };
