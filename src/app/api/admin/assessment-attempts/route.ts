import { getSession,hasRole } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
export async function GET(){const user=await getSession();if(!user||(user.role!=="admin"&&!(await hasRole(user,"instructor"))))return errorResponse("دسترسی غیرمجاز است.",403);try{await ensureSchema();const result=await pool.query(`SELECT at.id,at.attempt_number,at.started_at,at.submitted_at,a.title AS assessment_title,c.title AS course_title,u.username,
  aa.id AS answer_id,aa.answer,q.prompt,q.points,aa.points_awarded,aa.feedback
  FROM assessment_attempts at JOIN assessments a ON a.id=at.assessment_id JOIN courses c ON c.id=a.course_id JOIN users u ON u.id=at.user_id
  JOIN assessment_answers aa ON aa.attempt_id=at.id JOIN assessment_questions q ON q.id=aa.question_id
  WHERE at.status='submitted' AND q.question_type='short_text' AND ($1::boolean=TRUE OR EXISTS(SELECT 1 FROM course_instructors ci WHERE ci.course_id=a.course_id AND ci.user_id=$2))
  ORDER BY at.submitted_at ASC,at.id,aa.id LIMIT 1000`,[user.role==='admin',user.id]);const attempts=new Map<number,Record<string,unknown>>();for(const row of result.rows){const id=Number(row.id);if(!attempts.has(id))attempts.set(id,{id,attemptNumber:row.attempt_number,submittedAt:row.submitted_at,assessmentTitle:row.assessment_title,courseTitle:row.course_title,username:row.username,answers:[]});(attempts.get(id)!.answers as unknown[]).push({answerId:Number(row.answer_id),prompt:row.prompt,answer:row.answer,points:Number(row.points),pointsAwarded:Number(row.points_awarded),feedback:row.feedback});}return jsonResponse({attempts:[...attempts.values()]});}catch{return errorResponse("دریافت پاسخ‌های نیازمند ارزیابی انجام نشد.",503);}}
