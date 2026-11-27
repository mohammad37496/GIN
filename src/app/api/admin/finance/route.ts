import { canManageFinance,getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { paymentProviderStatus } from "@/lib/payments/provider";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";

 async function GET(){const admin=await getSession();if(!admin||!(await canManageFinance(admin)))return errorResponse("دسترسی مالی ندارید.",403);try{await ensureSchema();const [orders,transactions,refunds]=await Promise.all([
  pool.query(`SELECT o.public_id,o.status,o.currency,o.total_minor,o.created_at,o.paid_at,u.username,i.invoice_number FROM orders o JOIN users u ON u.id=o.user_id LEFT JOIN invoices i ON i.order_id=o.id ORDER BY o.created_at DESC LIMIT 200`),
  pool.query(`SELECT t.id,t.provider,t.provider_reference,t.status,t.amount_minor,t.currency,t.created_at,o.public_id AS order_public_id FROM payment_transactions t JOIN orders o ON o.id=t.order_id ORDER BY t.created_at DESC LIMIT 200`),
  pool.query("SELECT status,COUNT(*)::int AS count FROM payment_refunds GROUP BY status"),
]);return jsonResponse({provider:paymentProviderStatus(),orders:orders.rows,transactions:transactions.rows,refunds:refunds.rows});}catch{return errorResponse("دریافت گزارش مالی انجام نشد.",503);}}


const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
