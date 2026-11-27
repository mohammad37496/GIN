import { withApiErrorBoundary } from "@/lib/api-error-boundary";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";

async function GET(){const admin=await requireAdmin();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);try{await ensureSchema();const result=await pool.query(`SELECT r.id,r.status,r.message,r.created_at,u.username,p.name AS plan_name,p.level
  FROM membership_requests r JOIN users u ON u.id=r.user_id JOIN membership_plans p ON p.id=r.plan_id ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 300`);return jsonResponse({requests:result.rows});}catch{return errorResponse("دریافت درخواست‌های عضویت انجام نشد.",503);}}

const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
