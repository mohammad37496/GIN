import { z } from "zod";
import { canManageCourse,getSession } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema=z.object({answers:z.array(z.object({answerId:z.number().int().positive(),pointsAwarded:z.number().min(0).max(10000),feedback:z.string().max(2000).default("")})).min(1).max(200)});

export async function PATCH(request:Request,{params}:{params:Promise<{attemptId:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await getSession();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);
  const attemptId=Number((await params).attemptId);if(!Number.isSafeInteger(attemptId)||attemptId<1)return errorResponse("تلاش آزمون پیدا نشد.",404);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("نمره‌های ارسالی معتبر نیستند.");
  if(new Set(parsed.data.answers.map((answer)=>answer.answerId)).size!==parsed.data.answers.length)return errorResponse("هر پاسخ فقط یک بار باید ارزیابی شود.");
  try{await ensureSchema();const result=await inTransaction(async(client)=>{
    const attempt=await client.query(`SELECT at.id,at.user_id,at.assessment_id,at.status,a.course_id,a.pass_percent
      FROM assessment_attempts at JOIN assessments a ON a.id=at.assessment_id WHERE at.id=$1 FOR UPDATE OF at`,[attemptId]);
    if(!attempt.rowCount||attempt.rows[0].status!=="submitted")return null;
    if(!(await canManageCourse(admin,Number(attempt.rows[0].course_id),client)))return {forbidden:true as const};
    const answers=await client.query(`SELECT aa.id,q.points FROM assessment_answers aa JOIN assessment_questions q ON q.id=aa.question_id
      WHERE aa.attempt_id=$1 AND q.question_type='short_text'`,[attemptId]);
    if(answers.rowCount!==parsed.data.answers.length||parsed.data.answers.some((item)=>!answers.rows.some((answer)=>Number(answer.id)===item.answerId)))return {invalid:true as const};
    let possible=0;let awarded=0;
    for(const answer of answers.rows){const update=parsed.data.answers.find((item)=>item.answerId===Number(answer.id))!;if(update.pointsAwarded>Number(answer.points))return {invalid:true as const};possible+=Number(answer.points);awarded+=update.pointsAwarded;await client.query("UPDATE assessment_answers SET points_awarded=$1,is_correct=$2,feedback=$3 WHERE id=$4",[update.pointsAwarded,update.pointsAwarded===Number(answer.points),update.feedback,answer.id]);}
    const automatic=await client.query(`SELECT COALESCE(SUM(q.points),0)::numeric AS possible,COALESCE(SUM(aa.points_awarded),0)::numeric AS awarded
      FROM assessment_answers aa JOIN assessment_questions q ON q.id=aa.question_id WHERE aa.attempt_id=$1 AND q.question_type<>'short_text'`,[attemptId]);
    possible+=Number(automatic.rows[0].possible);awarded+=Number(automatic.rows[0].awarded);
    const score=possible?Math.round((awarded/possible)*10000)/100:0;const passed=score>=Number(attempt.rows[0].pass_percent);
    await client.query("UPDATE assessment_attempts SET status='graded',score_percent=$1,passed=$2,graded_at=NOW() WHERE id=$3",[score,passed,attemptId]);
    let courseCompleted=false;
    if(passed){const courseId=attempt.rows[0].course_id;const lessonTotals=await client.query(`SELECT COUNT(l.id)::int AS total,COUNT(lp.id) FILTER(WHERE lp.status='completed')::int AS completed
      FROM course_sections s JOIN lessons l ON l.section_id=s.id AND l.status='published' LEFT JOIN lesson_progress lp ON lp.lesson_id=l.id AND lp.user_id=$2 WHERE s.course_id=$1`,[courseId,attempt.rows[0].user_id]);
      const pending=await client.query(`SELECT COUNT(*)::int AS count FROM assessments a WHERE a.course_id=$1 AND a.status='published' AND NOT EXISTS(
        SELECT 1 FROM assessment_attempts x WHERE x.assessment_id=a.id AND x.user_id=$2 AND x.status='graded' AND x.passed=TRUE)`,[courseId,attempt.rows[0].user_id]);
      courseCompleted=lessonTotals.rows[0].total>0&&lessonTotals.rows[0].total===lessonTotals.rows[0].completed&&pending.rows[0].count===0;
      if(courseCompleted)await client.query("UPDATE course_enrollments SET status='completed',completed_at=COALESCE(completed_at,NOW()) WHERE course_id=$1 AND user_id=$2 AND status='active'",[courseId,attempt.rows[0].user_id]);
    }
    await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,'assessment_manually_graded','assessment_attempt',$2,$3::jsonb)",[admin.id,attemptId,JSON.stringify({scorePercent:score,passed})]);
    return {scorePercent:score,passed,courseCompleted};
  });if(!result)return errorResponse("این تلاش آزمون برای ارزیابی دستی در دسترس نیست.",409);if("forbidden" in result)return errorResponse("دسترسی ارزیابی این دوره را ندارید.",403);if("invalid" in result)return errorResponse("نمره یکی از پاسخ‌ها نامعتبر است.",400);return jsonResponse({result,message:"ارزیابی دستی ثبت شد."});
  }catch{return errorResponse("ثبت ارزیابی دستی انجام نشد.",503);}
}
