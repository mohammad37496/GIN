import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";

 async function PATCH(request:Request,{params}:{params:Promise<{notificationId:string}>}){const originError=rejectCrossOriginMutation(request);if(originError)return originError;const user=await getSession();if(!user)return errorResponse("ابتدا وارد شوید.",401);const id=Number((await params).notificationId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("اعلان پیدا نشد.",404);try{await ensureSchema();const result=await pool.query("UPDATE notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND user_id=$2 RETURNING id,read_at",[id,user.id]);if(!result.rowCount)return errorResponse("اعلان پیدا نشد.",404);return jsonResponse({notification:result.rows[0]});}catch{return errorResponse("به‌روزرسانی اعلان انجام نشد.",503);}}


const wrappedPATCH = withApiErrorBoundary(PATCH);
export { wrappedPATCH as PATCH };
