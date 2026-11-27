import { getSession,hasRole } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";

 async function GET(){const user=await getSession();if(!user||!(await hasRole(user,"support")))return errorResponse("دسترسی پشتیبانی ندارید.",403);try{await ensureSchema();const result=await pool.query(`SELECT sm.id,sm.user_id,sm.subject,sm.message,sm.status,sm.assigned_to,sm.created_at,sm.updated_at,u.username,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('id',sr.id,'author_id',sr.author_id,'is_staff',sr.is_staff,'body',sr.body,'created_at',sr.created_at) ORDER BY sr.created_at)
    FROM support_replies sr WHERE sr.message_id=sm.id),'[]'::jsonb) AS replies
  FROM support_messages sm JOIN users u ON u.id=sm.user_id ORDER BY CASE sm.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,sm.created_at DESC LIMIT 500`);return jsonResponse({messages:result.rows});}catch{return errorResponse("دریافت پیام‌های پشتیبانی انجام نشد.",503);}}


const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
