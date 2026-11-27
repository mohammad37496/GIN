import { withApiErrorBoundary } from "@/lib/api-error-boundary";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema,inTransaction,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema=z.object({courseIds:z.array(z.number().int().positive()).max(500)});

async function GET(_request:Request,{params}:{params:Promise<{planId:string}>}){const admin=await requireAdmin();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);const planId=Number((await params).planId);if(!Number.isSafeInteger(planId)||planId<1)return errorResponse("پلن پیدا نشد.",404);try{await ensureSchema();const result=await pool.query("SELECT course_id FROM membership_plan_courses WHERE plan_id=$1 ORDER BY course_id",[planId]);return jsonResponse({courseIds:result.rows.map(row=>Number(row.course_id))});}catch{return errorResponse("دریافت دوره‌های پلن انجام نشد.",503);}}

async function PUT(request:Request,{params}:{params:Promise<{planId:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await requireAdmin();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);
  const planId=Number((await params).planId);if(!Number.isSafeInteger(planId)||planId<1)return errorResponse("پلن پیدا نشد.",404);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success||new Set(parsed.data?.courseIds??[]).size!==parsed.data?.courseIds.length)return errorResponse("فهرست دوره‌ها معتبر نیست.");
  try{
    await ensureSchema();
    const result=await inTransaction(async(client)=>{
      const plan=await client.query("SELECT id FROM membership_plans WHERE id=$1 FOR UPDATE",[planId]);if(!plan.rowCount)return null;
      const previous=await client.query("SELECT course_id FROM membership_plan_courses WHERE plan_id=$1",[planId]);
      if(parsed.data.courseIds.length){const courses=await client.query("SELECT id FROM courses WHERE id=ANY($1::bigint[])",[parsed.data.courseIds]);if(courses.rowCount!==parsed.data.courseIds.length)return {invalid:true as const};}
      const oldIds=previous.rows.map(row=>Number(row.course_id));const newIds=parsed.data.courseIds;
      const removed=oldIds.filter(id=>!newIds.includes(id));const added=newIds.filter(id=>!oldIds.includes(id));
      await client.query("DELETE FROM membership_plan_courses WHERE plan_id=$1",[planId]);
      for(const courseId of newIds)await client.query("INSERT INTO membership_plan_courses(plan_id,course_id) VALUES($1,$2)",[planId,courseId]);
      for(const courseId of removed){
        const members=await client.query(`SELECT user_id FROM memberships WHERE plan_id=$1 AND status='active'
          AND (starts_at IS NULL OR starts_at<=NOW()) AND (ends_at IS NULL OR ends_at>NOW())`,[planId]);
        for(const member of members.rows){
          const other=await client.query(`SELECT 1 FROM memberships m JOIN membership_plan_courses pc ON pc.plan_id=m.plan_id
            WHERE m.user_id=$1 AND pc.course_id=$2 AND m.plan_id<>$3 AND m.status='active'
              AND (m.starts_at IS NULL OR m.starts_at<=NOW()) AND (m.ends_at IS NULL OR m.ends_at>NOW()) LIMIT 1`,[member.user_id,courseId,planId]);
          if(!other.rowCount){const revoked=await client.query(`UPDATE course_enrollments SET status='revoked' WHERE course_id=$1 AND user_id=$2
            AND source='subscription' AND status IN ('active','completed') RETURNING id`,[courseId,member.user_id]);
            for(const enrollment of revoked.rows)await client.query(`INSERT INTO course_enrollment_events(enrollment_id,actor_id,event_type,previous_status,next_status,reason)
              VALUES($1,$2,'revoked','active','revoked','Membership plan entitlement removed')`,[enrollment.id,admin.id]);
          }
        }
      }
      for(const courseId of added){
        const members=await client.query(`SELECT user_id,ends_at FROM memberships WHERE plan_id=$1 AND status='active'
          AND (starts_at IS NULL OR starts_at<=NOW()) AND (ends_at IS NULL OR ends_at>NOW())`,[planId]);
        for(const member of members.rows)await client.query(`INSERT INTO course_enrollments(course_id,user_id,status,source,expires_at)
          VALUES($1,$2,'active','subscription',$3) ON CONFLICT(course_id,user_id) DO UPDATE
          SET status='active',source='subscription',expires_at=EXCLUDED.expires_at,enrolled_at=NOW(),completed_at=NULL
          WHERE course_enrollments.status='revoked' OR (course_enrollments.source='subscription' AND course_enrollments.expires_at<=NOW())`,
        [courseId,member.user_id,member.ends_at]);
      }
      await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,'membership_plan_courses_updated','membership_plan',$2,$3::jsonb)",[admin.id,planId,JSON.stringify({courseIds:newIds,added,removed})]);
      return {count:newIds.length,added,removed};
    });
    if(!result)return errorResponse("پلن پیدا نشد.",404);if('invalid'in result)return errorResponse("یکی از دوره‌های انتخاب‌شده وجود ندارد.",400);
    return jsonResponse({result,message:"دسترسی دوره‌های پلن به‌روزرسانی و برای اعضای فعال همگام شد."});
  }catch{return errorResponse("به‌روزرسانی دسترسی پلن انجام نشد.",503);}
}

const wrappedGET = withApiErrorBoundary(GET);
const wrappedPUT = withApiErrorBoundary(PUT);
export { wrappedGET as GET, wrappedPUT as PUT };
