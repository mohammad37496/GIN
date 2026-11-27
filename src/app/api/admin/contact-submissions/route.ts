import { getSession, hasRole } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


 async function GET() {
  const user = await getSession();
  if (!user || !(await hasRole(user, "support"))) return errorResponse("Support team access is required.", 403);
  try {
    await ensureSchema();
    const result = await pool.query(`SELECT c.id,c.first_name,c.last_name,c.email,c.phone,c.address_line1,c.address_line2,
      c.city,c.state_region,c.postal_code,c.country,c.preferred_language,c.secondary_language,c.preferred_contact_methods,
      c.telegram_handle,c.whatsapp_number,c.subject,c.message,c.sms_consent,c.legal_consent,c.status,c.assigned_to,
      c.created_at,c.updated_at,u.username AS assigned_username
      FROM contact_submissions c LEFT JOIN users u ON u.id=c.assigned_to
      ORDER BY CASE c.status WHEN 'new' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,c.created_at DESC LIMIT 500`);
    return jsonResponse({ submissions: result.rows });
  } catch {
    return errorResponse("Contact submissions could not be loaded.", 503);
  }
}


const wrappedGET = withApiErrorBoundary(GET);
export { wrappedGET as GET };
