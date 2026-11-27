import { createHash } from "node:crypto";
import { getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { contactSubmissionSchema } from "@/lib/contact-submission";
import { enforceRateLimit, rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


 async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  try {
    const limited = await enforceRateLimit(request, "public-contact-form", 5, 3600);
    if (limited) return limited;
    const parsed = contactSubmissionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return errorResponse("Please review the contact form fields and try again.", 400);
    if (parsed.data.item_6__fluent_sf) return jsonResponse({ notice: "Your message has been received." }, 202);

    await ensureSchema();
    const user = await getSession();
    const forwarded = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
    const address = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || forwarded || "unknown";
    const ipHash = createHash("sha256").update(address).digest("hex");
    const value = parsed.data;
    const result = await pool.query(`INSERT INTO contact_submissions(
      user_id,first_name,last_name,email,phone,address_line1,address_line2,city,state_region,postal_code,country,
      preferred_language,secondary_language,preferred_contact_methods,telegram_handle,whatsapp_number,subject,message,
      sms_consent,legal_consent,ip_hash
    ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    RETURNING id,created_at`, [
      user?.id ?? null, value.firstName, value.lastName, value.email, value.phone, value.addressLine1,
      value.addressLine2 || null, value.city, value.stateRegion || null, value.postalCode || null, value.country,
      value.preferredLanguage, value.secondaryLanguage || null, value.preferredContactMethods,
      value.telegramHandle || null, value.whatsappNumber || null,
      value.subject, value.message, value.smsConsent, value.legalConsent, ipHash,
    ]);
    return jsonResponse({ submissionId: result.rows[0].id, notice: "Your message has been recorded for the portal support team." }, 201);
  } catch {
    return errorResponse("The contact request could not be saved. Please call the official number listed on the Contact page.", 503);
  }
}


const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedPOST as POST };
