import { getSession,hasRole } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


 async function GET(_request:Request,{params}:{params:Promise<{eventId:string}>}){const admin=await getSession();if(!admin||(admin.role!=="admin"&&!(await hasRole(admin,"event_manager"))))return errorResponse("دسترسی مدیریت رویداد ندارید.",403);const id=Number((await params).eventId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("رویداد پیدا نشد.",404);try{await ensureSchema();const result=await pool.query(`SELECT r.id,r.status,r.registered_at,r.canceled_at,u.id AS user_id,u.username
  FROM event_registrations r JOIN users u ON u.id=r.user_id WHERE r.event_id=$1 ORDER BY r.registered_at DESC LIMIT 1000`,[id]);return jsonResponse({registrations:result.rows});}catch{return errorResponse("دریافت فهرست شرکت‌کنندگان انجام نشد.",503);}}


const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
