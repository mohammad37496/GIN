import { ensureSchema,pool } from "@/lib/db";
import { jsonResponse,errorResponse } from "@/lib/http";

export async function GET(){try{await ensureSchema();const result=await pool.query(`SELECT id,code,name,description,level,price_minor,currency,billing_interval,benefits
  FROM membership_plans WHERE is_active=TRUE ORDER BY level,id`);return jsonResponse({plans:result.rows});}catch{return errorResponse("دریافت پلن‌های عضویت ممکن نشد.",503);}}
