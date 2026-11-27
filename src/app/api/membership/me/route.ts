import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { syncMembershipState } from "@/lib/membership";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


 async function GET(){const user=await getSession();if(!user)return errorResponse("ابتدا وارد شوید.",401);try{await ensureSchema();await syncMembershipState(user.id);const [memberships,requests]=await Promise.all([
  pool.query(`SELECT m.id,m.plan_id,m.status,m.starts_at,m.ends_at,m.cancel_at_period_end,m.source,p.name AS plan_name,p.level,p.benefits
    FROM memberships m JOIN membership_plans p ON p.id=m.plan_id WHERE m.user_id=$1 ORDER BY m.created_at DESC LIMIT 50`,[user.id]),
  pool.query(`SELECT r.id,r.status,r.message,r.created_at,p.name AS plan_name FROM membership_requests r JOIN membership_plans p ON p.id=r.plan_id WHERE r.user_id=$1 ORDER BY r.created_at DESC LIMIT 50`,[user.id]),
]);return jsonResponse({memberships:memberships.rows,requests:requests.rows});}catch{return errorResponse("دریافت سوابق عضویت ممکن نشد.",503);}}


const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
