import { canManageFinance,getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { paymentProviderStatus } from "@/lib/payments/provider";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


 async function GET(){const admin=await getSession();if(!admin||!(await canManageFinance(admin)))return errorResponse("دسترسی مالی ندارید.",403);try{await ensureSchema();const [orders,transactions]=await Promise.all([
  pool.query("SELECT status,COUNT(*)::int AS count FROM orders GROUP BY status"),
  pool.query("SELECT status,COUNT(*)::int AS count FROM payment_transactions GROUP BY status"),
]);return jsonResponse({provider:paymentProviderStatus(),orders:orders.rows,transactions:transactions.rows});}catch{return errorResponse("دریافت وضعیت مالی انجام نشد.",503);}}


const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
