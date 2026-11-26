import { pool, ensureSchema } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("دسترسی غیرمجاز است.", 403);
  await ensureSchema();
  const result = await pool.query("SELECT id, username, role, status, created_at FROM users ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, created_at DESC LIMIT 300");
  return jsonResponse({ users: result.rows });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("دسترسی غیرمجاز است.", 403);
  const body = await request.json().catch(() => null);
  const id = Number(body?.id);
  const status = body?.status;
  if (!Number.isSafeInteger(id) || id < 1 || !["approved", "rejected", "suspended"].includes(status)) return errorResponse("درخواست نامعتبر است.");
  await ensureSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const updated = await client.query("UPDATE users SET status=$1, reviewed_at=NOW(), reviewed_by=$2 WHERE id=$3 AND role <> 'admin' RETURNING id", [status, admin.id, id]);
    if (!updated.rowCount) { await client.query("ROLLBACK"); return errorResponse("کاربر پیدا نشد یا امکان تغییر این حساب وجود ندارد.", 404); }
    await client.query("INSERT INTO audit_logs(actor_id, action, target_user_id) VALUES($1,$2,$3)", [admin.id, status, id]);
    await client.query("COMMIT");
    return jsonResponse({ message: "وضعیت کاربر به‌روزرسانی شد." });
  } catch { await client.query("ROLLBACK"); return errorResponse("ذخیره تغییرات انجام نشد.", 500); }
  finally { client.release(); }
}
