import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { getSession, hasRole, isSessionSecretConfigurationError } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/http";
import { ensureSchema, isDatabaseUnavailableError, pool } from "@/lib/db";
import { enforceRateLimit,rejectCrossOriginMutation } from "@/lib/request-security";
import { getStorageConfig } from "@/lib/storage";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";
import { logStorageFailure, mapStorageProviderError } from "@/lib/storage-errors";
import { createSignedUpload } from "@/lib/storage-presign";


const schema = z.object({ filename: z.string().min(1).max(180), contentType: z.string().regex(/^(image\/(jpeg|png|webp|gif)|application\/pdf|video\/mp4)$/), size: z.number().int().positive().max(25 * 1024 * 1024) });

 async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  let user;
  try {
    user = await getSession();
    if (!user) return errorResponse("برای بارگذاری فایل ابتدا وارد شوید.", 401);
    if (!(await hasRole(user, "instructor"))) return errorResponse("فقط مدیر یا مدرس مجاز به بارگذاری فایل آموزشی است.", 403);
  } catch (error) {
    console.error("GIN storage presign authorization failed", error);
    return errorResponse("احراز هویت برای بارگذاری فایل انجام نشد.", isDatabaseUnavailableError(error) || isSessionSecretConfigurationError(error) ? 503 : 500);
  }
  const limited=await enforceRateLimit(request,"storage-presign",20,3600);if(limited)return limited;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("نوع یا اندازه فایل مجاز نیست.");
  const storage=getStorageConfig();if(!storage)return errorResponse("فضای ذخیره‌سازی هنوز پیکربندی نشده است.",503);
  const extension = parsed.data.filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const allowedExtensions:Record<string,string[]>={"image/jpeg":["jpg","jpeg"],"image/png":["png"],"image/webp":["webp"],"image/gif":["gif"],"application/pdf":["pdf"],"video/mp4":["mp4"]};
  if(!allowedExtensions[parsed.data.contentType]?.includes(extension))return errorResponse("پسوند فایل با نوع محتوای اعلام‌شده سازگار نیست.");
  const uploadId = randomUUID();
  const key = `assets/${user.id}/${uploadId}.${extension}`;
  const uploadKey = `uploads/${user.id}/${uploadId}.${extension}`;
  const command = new PutObjectCommand({ Bucket: storage.bucket, Key: uploadKey, ContentType: parsed.data.contentType, ContentLength: parsed.data.size });
  await ensureSchema();
  try {
    const signedUpload = await createSignedUpload(
      () => getSignedUrl(storage.client, command, { expiresIn: 300 }),
      () => pool.query(`INSERT INTO stored_assets(owner_id,object_key,upload_key,original_filename,content_type,size_bytes)
        VALUES($1,$2,$3,$4,$5,$6) RETURNING id`, [user.id,key,uploadKey,parsed.data.filename,parsed.data.contentType,parsed.data.size]),
    );
    return jsonResponse({ assetId: Number(signedUpload.asset.rows[0].id), uploadUrl: signedUpload.uploadUrl, expiresIn: 300 });
  } catch (error) {
    const response = mapStorageProviderError("presign", error);
    if (response) return response;
    logStorageFailure("presign", error);
    throw error;
  }
}


const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedPOST as POST };
