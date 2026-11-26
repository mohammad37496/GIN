import { ensureSchema, pool } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";

export async function GET(_request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(publicId)) return errorResponse("شناسه گواهی معتبر نیست.", 404);
  try {
    await ensureSchema();
    const result = await pool.query(`SELECT ce.public_id,ce.serial_number,ce.issued_at,ce.revoked_at,c.title AS course_title
      FROM certificates ce JOIN courses c ON c.id=ce.course_id WHERE ce.public_id=$1`, [publicId]);
    const certificate = result.rows[0];
    if (!certificate) return errorResponse("گواهی پیدا نشد.", 404);
    return jsonResponse({ certificate: { ...certificate, valid: !certificate.revoked_at } });
  } catch {
    return errorResponse("اعتبارسنجی گواهی ممکن نشد.", 503);
  }
}
