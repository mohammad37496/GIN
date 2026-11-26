import { z } from "zod";
import { canManageCourse,getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema=z.object({status:z.enum(["draft","published","archived"])});

export async function PATCH(request:Request,{params}:{params:Promise<{assessmentId:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await getSession();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);
  const id=Number((await params).assessmentId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("آزمون پیدا نشد.",404);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("وضعیت آزمون معتبر نیست.");
  try{await ensureSchema();const result=await inTransaction(async(client)=>{
    const assessment=await client.query("SELECT id,status,course_id FROM assessments WHERE id=$1 FOR UPDATE",[id]);if(!assessment.rowCount)return null;if(!(await canManageCourse(admin,Number(assessment.rows[0].course_id),client)))return {forbidden:true as const};
    if(parsed.data.status==="published"){
      const questions=await client.query("SELECT COUNT(*)::int AS count FROM assessment_questions WHERE assessment_id=$1",[id]);
      if(!questions.rows[0].count)return {invalid:true as const};
    }
    const updated=await client.query("UPDATE assessments SET status=$1::varchar,updated_at=NOW() WHERE id=$2 RETURNING id,status",[parsed.data.status,id]);
    await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'assessment',$3,$4::jsonb)",[admin.id,`assessment_${parsed.data.status}`,id,JSON.stringify({previousStatus:assessment.rows[0].status,nextStatus:parsed.data.status})]);
    return updated.rows[0];
  });if(!result)return errorResponse("آزمون پیدا نشد.",404);if("forbidden" in result)return errorResponse("دسترسی مدیریت دوره ندارید.",403);if("invalid" in result)return errorResponse("برای انتشار آزمون دست‌کم یک سؤال لازم است.",409);return jsonResponse({assessment:result,message:"وضعیت آزمون به‌روزرسانی شد."});
  }catch{return errorResponse("تغییر وضعیت آزمون انجام نشد.",503);}
}
