import { randomUUID } from "node:crypto";
import { getSession } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


 async function POST(request:Request,{params}:{params:Promise<{slug:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const user=await getSession();if(!user)return errorResponse("برای دریافت گواهی وارد شوید.",401);
  const {slug}=await params;
  try{await ensureSchema();const result=await inTransaction(async(client)=>{
    const enrollment=await client.query(`SELECT e.id,e.status,c.id AS course_id,c.title FROM course_enrollments e
      JOIN courses c ON c.id=e.course_id WHERE c.slug=$1 AND e.user_id=$2 AND c.status='published'
      AND e.status='completed' AND (e.expires_at IS NULL OR e.expires_at>NOW()) FOR UPDATE OF e`,[slug,user.id]);
    if(!enrollment.rowCount)return {incomplete:true as const};
    const courseId=enrollment.rows[0].course_id;
    const pending=await client.query(`SELECT COUNT(*)::int AS count FROM assessments a WHERE a.course_id=$1 AND a.status='published'
      AND NOT EXISTS(SELECT 1 FROM assessment_attempts at WHERE at.assessment_id=a.id AND at.user_id=$2 AND at.status='graded' AND at.passed=TRUE)`,[courseId,user.id]);
    if(pending.rows[0].count>0)return {assessments:true as const};
    const serial=`GIN-${new Date().getUTCFullYear()}-${randomUUID().replace(/-/g,"").slice(0,16).toUpperCase()}`;
    const inserted=await client.query(`INSERT INTO certificates(serial_number,course_id,user_id,enrollment_id) VALUES($1,$2,$3,$4)
      ON CONFLICT(enrollment_id) DO NOTHING RETURNING public_id,serial_number,issued_at`,[serial,courseId,user.id,enrollment.rows[0].id]);
    if(inserted.rowCount)return {certificate:inserted.rows[0],courseTitle:enrollment.rows[0].title};
    const existing=await client.query("SELECT public_id,serial_number,issued_at FROM certificates WHERE enrollment_id=$1",[enrollment.rows[0].id]);
    return {certificate:existing.rows[0],courseTitle:enrollment.rows[0].title};
  });
  if('incomplete'in result)return errorResponse("برای دریافت گواهی باید همه درس‌های دوره را تکمیل کنید.",409);
  if('assessments'in result)return errorResponse("ابتدا باید همه آزمون‌های الزامی دوره را با موفقیت بگذرانید.",409);
  return jsonResponse({certificate:{...result.certificate,verificationUrl:`/certificates/${result.certificate.public_id}`},message:"گواهی پایان دوره آماده است."},201);
  }catch{return errorResponse("صدور گواهی انجام نشد.",503);}
}


const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedPOST as POST };
