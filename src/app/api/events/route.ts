import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";

export async function GET(){try{await ensureSchema();const result=await pool.query(`SELECT e.id,e.slug,e.title,e.summary,e.location,e.starts_at,e.ends_at,e.capacity,e.access_type,
  COUNT(r.id) FILTER(WHERE r.status='registered')::int AS registered_count,
  CASE WHEN e.capacity IS NULL THEN NULL ELSE GREATEST(e.capacity-COUNT(r.id) FILTER(WHERE r.status='registered'),0)::int END AS seats_remaining
  FROM events e LEFT JOIN event_registrations r ON r.event_id=e.id WHERE e.status='published' AND e.ends_at>NOW()
  GROUP BY e.id ORDER BY e.starts_at`);return jsonResponse({events:result.rows});}catch{return errorResponse("دریافت رویدادها ممکن نشد.",503);}}
