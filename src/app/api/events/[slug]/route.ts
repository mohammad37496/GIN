import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";

export async function GET(_request:Request,{params}:{params:Promise<{slug:string}>}){try{await ensureSchema();const {slug}=await params;const user=await getSession();const result=await pool.query(`SELECT e.id,e.slug,e.title,e.summary,e.description,e.location,
  CASE WHEN EXISTS(SELECT 1 FROM event_registrations mine WHERE mine.event_id=e.id AND mine.user_id=$2 AND mine.status='registered') THEN e.meeting_url ELSE NULL END AS meeting_url,
  e.starts_at,e.ends_at,e.capacity,e.access_type,e.price_minor,e.currency,
  COUNT(r.id) FILTER(WHERE r.status='registered')::int AS registered_count,
  EXISTS(SELECT 1 FROM event_registrations mine WHERE mine.event_id=e.id AND mine.user_id=$2 AND mine.status IN ('registered','attended')) AS is_registered
  FROM events e LEFT JOIN event_registrations r ON r.event_id=e.id WHERE e.slug=$1 AND e.status='published' GROUP BY e.id`,[slug,user?.id??null]);if(!result.rowCount)return errorResponse("رویداد پیدا نشد.",404);return jsonResponse({event:result.rows[0]});}catch{return errorResponse("دریافت رویداد ممکن نشد.",503);}}
