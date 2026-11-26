import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
export async function GET(){const user=await getSession();if(!user)return errorResponse("ابتدا وارد شوید.",401);try{await ensureSchema();const result=await pool.query("SELECT id,type,title,body,href,read_at,created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100",[user.id]);return jsonResponse({notifications:result.rows,unreadCount:result.rows.filter(row=>!row.read_at).length});}catch{return errorResponse("دریافت اعلان‌ها انجام نشد.",503);}}
