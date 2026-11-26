import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
export async function GET(){const user=await getSession();if(!user)return errorResponse("ابتدا وارد شوید.",401);try{await ensureSchema();const result=await pool.query(`SELECT o.public_id,o.status,o.currency,o.subtotal_minor,o.discount_minor,o.total_minor,o.created_at,o.paid_at,i.invoice_number,i.issued_at AS invoice_issued_at
  FROM orders o LEFT JOIN invoices i ON i.order_id=o.id WHERE o.user_id=$1 ORDER BY o.created_at DESC LIMIT 100`,[user.id]);return jsonResponse({orders:result.rows});}catch{return errorResponse("دریافت سوابق سفارش انجام نشد.",503);}}
