import { z } from "zod";
import { getSession, hasRole } from "@/lib/auth";
import { ensureSchema, inTransaction } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


const schema = z.object({ status: z.enum(["new", "in_progress", "resolved", "closed"]), assignedTo: z.number().int().positive().nullable().optional() });

 async function PATCH(request: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  const user = await getSession();
  if (!user || !(await hasRole(user, "support"))) return errorResponse("Support team access is required.", 403);
  const id = Number((await params).submissionId);
  if (!Number.isSafeInteger(id) || id < 1) return errorResponse("Contact submission not found.", 404);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("The contact submission status is invalid.", 400);
  try {
    await ensureSchema();
    const result = await inTransaction(async (client) => {
      const current = await client.query("SELECT id,status FROM contact_submissions WHERE id=$1 FOR UPDATE", [id]);
      if (!current.rowCount) return null;
      const assignedTo = parsed.data.assignedTo ?? user.id;
      if (assignedTo !== user.id) {
        const permitted = await client.query("SELECT 1 FROM users u WHERE u.id=$1 AND (u.role='admin' OR EXISTS(SELECT 1 FROM user_roles r WHERE r.user_id=u.id AND r.role='support'))", [assignedTo]);
        if (!permitted.rowCount) return { invalidAssignee: true as const };
      }
      const updated = await client.query("UPDATE contact_submissions SET status=$1,assigned_to=$2,updated_at=NOW() WHERE id=$3 RETURNING id,status,assigned_to", [parsed.data.status, assignedTo, id]);
      await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,'contact_submission_status_updated','contact_submission',$2,$3::jsonb)", [user.id, id, JSON.stringify({ previousStatus: current.rows[0].status, nextStatus: parsed.data.status, assignedTo })]);
      return updated.rows[0];
    });
    if (!result) return errorResponse("Contact submission not found.", 404);
    if ("invalidAssignee" in result) return errorResponse("The selected assignee is not on the support team.", 400);
    return jsonResponse({ submission: result });
  } catch {
    return errorResponse("The contact submission could not be updated.", 503);
  }
}


const wrappedPATCH = withApiErrorBoundary(PATCH);
export { wrappedPATCH as PATCH };
