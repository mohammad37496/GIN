import { randomUUID } from "node:crypto";
import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, type HeadObjectCommandOutput } from "@aws-sdk/client-s3";
import { z } from "zod";
import { getSession, hasRole, isSessionSecretConfigurationError } from "@/lib/auth";
import { ensureSchema, inTransaction, isDatabaseUnavailableError, pool } from "@/lib/db";
import { getStorageConfig } from "@/lib/storage";
import { errorResponse, jsonResponse } from "@/lib/http";
import { enforceRateLimit, rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";
import { logStorageFailure, mapStorageProviderError } from "@/lib/storage-errors";


const schema = z.object({ assetId: z.number().int().positive() });
const FINALIZING_LEASE_MS = 2 * 60 * 1000;

type StoredAsset = {
  id: number;
  owner_id: number;
  object_key: string;
  upload_key: string;
  content_type: string;
  size_bytes: number;
  status: string;
  created_at: Date | string;
  upload_etag: string | null;
  finalizing_at: Date | string | null;
};

function isMissingObject(error: unknown): boolean {
  const candidate = error as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.$metadata?.httpStatusCode === 404 || candidate.name === "NotFound" || candidate.name === "NoSuchKey" || candidate.Code === "NoSuchKey";
}

function isPreconditionFailed(error: unknown): boolean {
  const candidate = error as { name?: string; Code?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.$metadata?.httpStatusCode === 412 || candidate.name === "PreconditionFailed" || candidate.Code === "PreconditionFailed";
}

function normalizedEtag(etag: string): string {
  return etag.replace(/^"|"$/g, "");
}

function copySource(bucket: string, key: string): string {
  return `/${bucket}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function isExpectedFinalObject(head: HeadObjectCommandOutput, asset: StoredAsset): boolean {
  return Boolean(asset.upload_etag)
    && Number(head.ContentLength) === Number(asset.size_bytes)
    && head.ContentType === asset.content_type
    && head.Metadata?.["gin-asset-id"] === String(asset.id)
    && head.Metadata?.["gin-source-etag"] === normalizedEtag(asset.upload_etag as string);
}

async function readFinalObject(storage: NonNullable<ReturnType<typeof getStorageConfig>>, asset: StoredAsset) {
  try {
    return await storage.client.send(new HeadObjectCommand({ Bucket: storage.bucket, Key: asset.object_key }));
  } catch (error) {
    if (isMissingObject(error)) return null;
    throw error;
  }
}

async function removeStagingObject(storage: NonNullable<ReturnType<typeof getStorageConfig>>, asset: StoredAsset): Promise<void> {
  if (asset.upload_key === asset.object_key) return;
  await storage.client.send(new DeleteObjectCommand({ Bucket: storage.bucket, Key: asset.upload_key })).catch((error) => {
    logStorageFailure("staging_cleanup", error);
  });
}

 async function POST(request: Request) {
  const originError = rejectCrossOriginMutation(request);
  if (originError) return originError;
  let user;
  try {
    user = await getSession();
    if (!user || !(await hasRole(user, "instructor"))) return errorResponse("دسترسی بارگذاری ندارید.", 403);
  } catch (error) {
    console.error("GIN storage completion authorization failed", error);
    return errorResponse("احراز هویت برای تکمیل بارگذاری انجام نشد.", isDatabaseUnavailableError(error) || isSessionSecretConfigurationError(error) ? 503 : 500);
  }
  const limited = await enforceRateLimit(request, "storage-complete", 30, 3600);
  if (limited) return limited;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("شناسه فایل معتبر نیست.");
  const storage = getStorageConfig();
  if (!storage) return errorResponse("فضای ذخیره‌سازی پیکربندی نشده است.", 503);

  try {
    await ensureSchema();
    const selected = await pool.query(`SELECT id,owner_id,object_key,upload_key,content_type,size_bytes,status,created_at,upload_etag,finalizing_at
      FROM stored_assets WHERE id=$1`, [parsed.data.assetId]);
    const initial = selected.rows[0] as StoredAsset | undefined;
    if (!initial || Number(initial.owner_id) !== user.id) return errorResponse("فایل پیدا نشد.", 404);
    if (initial.status === "ready") {
      await removeStagingObject(storage, initial);
      return jsonResponse({ assetId: Number(initial.id), status: "ready", message: "فایل قبلاً تأیید شده است." });
    }
    if (initial.status === "quarantined" || initial.status === "deleted") return errorResponse("این فایل قابل تأیید نیست.", 409);
    if (initial.status === "pending" && new Date(initial.created_at).getTime() < Date.now() - 15 * 60 * 1000) {
      return errorResponse("مهلت بارگذاری فایل به پایان رسیده است.", 409);
    }

    if (initial.status === "finalizing") {
      const finalHead = await readFinalObject(storage, initial);
      if (finalHead) {
        if (!isExpectedFinalObject(finalHead, initial)) return errorResponse("فایل نهایی با اطلاعات ثبت‌شده مطابقت ندارد.", 409);
        const recovered = await pool.query(`UPDATE stored_assets SET status='ready',verified_at=COALESCE(verified_at,NOW()),finalizing_at=NULL
          WHERE id=$1 AND status='finalizing' AND upload_etag=$2 RETURNING id`, [initial.id, initial.upload_etag]);
        if (recovered.rowCount) {
          await removeStagingObject(storage, initial);
          return jsonResponse({ assetId: Number(initial.id), status: "ready", message: "فایل قبلاً کپی و تأیید شده است." });
        }
        const latest = await pool.query("SELECT status FROM stored_assets WHERE id=$1", [initial.id]);
        if (latest.rows[0]?.status === "ready") return jsonResponse({ assetId: Number(initial.id), status: "ready", message: "فایل قبلاً تأیید شده است." });
        return errorResponse("درخواست تأیید فایل هم‌زمان در حال اجرا است.", 409);
      }
      if (initial.finalizing_at && Date.now() - new Date(initial.finalizing_at).getTime() < FINALIZING_LEASE_MS) {
        return errorResponse("تأیید فایل در حال انجام است؛ کمی بعد دوباره تلاش کنید.", 409);
      }
    }

    let uploadHead: HeadObjectCommandOutput;
    try {
      uploadHead = await storage.client.send(new HeadObjectCommand({ Bucket: storage.bucket, Key: initial.upload_key }));
    } catch (error) {
      if (isMissingObject(error)) return errorResponse("فایل بارگذاری‌شده در فضای ذخیره‌سازی پیدا نشد.", 409);
      throw error;
    }
    if (Number(uploadHead.ContentLength) !== Number(initial.size_bytes) || uploadHead.ContentType !== initial.content_type || !uploadHead.ETag) {
      await pool.query("UPDATE stored_assets SET status='quarantined',finalizing_at=NULL WHERE id=$1 AND status IN ('pending','finalizing')", [initial.id]);
      return errorResponse("مشخصات فایل بارگذاری‌شده با اطلاعات اولیه مطابقت ندارد.", 400);
    }

    const claim = await inTransaction(async (client) => {
      const locked = await client.query(`SELECT id,owner_id,object_key,upload_key,content_type,size_bytes,status,created_at,upload_etag,finalizing_at
        FROM stored_assets WHERE id=$1 AND owner_id=$2 FOR UPDATE`, [initial.id, user.id]);
      if (!locked.rowCount) return { missing: true as const };
      const row = locked.rows[0] as StoredAsset;
      if (row.status === "ready") return { ready: true as const };
      if (row.status === "quarantined" || row.status === "deleted") return { blocked: true as const };
      if (row.status === "pending" && new Date(row.created_at).getTime() < Date.now() - 15 * 60 * 1000) return { expired: true as const };
      if (row.status === "finalizing" && row.finalizing_at && Date.now() - new Date(row.finalizing_at).getTime() < FINALIZING_LEASE_MS) return { busy: true as const };
      if (row.upload_etag && row.upload_etag !== uploadHead.ETag) {
        await client.query("UPDATE stored_assets SET status='quarantined',finalizing_at=NULL WHERE id=$1", [row.id]);
        return { changed: true as const };
      }

      let finalKey = row.object_key;
      if (row.upload_key === row.object_key) {
        const references = await client.query("SELECT 1 FROM learning_resources WHERE object_key=$1 LIMIT 1", [row.object_key]);
        if (references.rowCount) return { referenced: true as const };
        finalKey = `assets/${row.owner_id}/${row.id}/${randomUUID()}`;
        await client.query("UPDATE stored_assets SET object_key=$2 WHERE id=$1", [row.id, finalKey]);
      }

      const updated = await client.query(`UPDATE stored_assets SET status='finalizing',upload_etag=COALESCE(upload_etag,$2),finalizing_at=NOW()
        WHERE id=$1 RETURNING id,owner_id,object_key,upload_key,content_type,size_bytes,status,created_at,upload_etag,finalizing_at`, [row.id, uploadHead.ETag]);
      return { asset: updated.rows[0] as StoredAsset };
    });

    if ("missing" in claim) return errorResponse("فایل پیدا نشد.", 404);
    if ("ready" in claim) {
      await removeStagingObject(storage, initial);
      return jsonResponse({ assetId: Number(initial.id), status: "ready", message: "فایل قبلاً تأیید شده است." });
    }
    if ("blocked" in claim) return errorResponse("این فایل قابل تأیید نیست.", 409);
    if ("expired" in claim) return errorResponse("مهلت بارگذاری فایل به پایان رسیده است.", 409);
    if ("busy" in claim) return errorResponse("تأیید فایل در حال انجام است؛ کمی بعد دوباره تلاش کنید.", 409);
    if ("changed" in claim) return errorResponse("محتوای فایل پس از شروع تأیید تغییر کرده است؛ فایل در قرنطینه قرار گرفت.", 409);
    if ("referenced" in claim) return errorResponse("فایل قدیمی به یک منبع آموزشی متصل است و قابل نهایی‌سازی مجدد نیست.", 409);
    const asset = claim.asset;

    try {
      await storage.client.send(new CopyObjectCommand({
        Bucket: storage.bucket,
        Key: asset.object_key,
        CopySource: copySource(storage.bucket, asset.upload_key),
        CopySourceIfMatch: asset.upload_etag as string,
        MetadataDirective: "REPLACE",
        Metadata: { "gin-asset-id": String(asset.id), "gin-source-etag": normalizedEtag(asset.upload_etag as string) },
        ContentType: asset.content_type,
      }));
    } catch (error) {
      if (isPreconditionFailed(error)) {
        await pool.query("UPDATE stored_assets SET status='quarantined',finalizing_at=NULL WHERE id=$1 AND status='finalizing' AND upload_etag=$2", [asset.id, asset.upload_etag]);
        return errorResponse("محتوای فایل پس از شروع تأیید تغییر کرده است؛ فایل در قرنطینه قرار گرفت.", 409);
      }
      throw error;
    }

    const finalHead = await storage.client.send(new HeadObjectCommand({ Bucket: storage.bucket, Key: asset.object_key }));
    if (!isExpectedFinalObject(finalHead, asset)) {
      await pool.query("UPDATE stored_assets SET status='quarantined',finalizing_at=NULL WHERE id=$1 AND status='finalizing'", [asset.id]);
      return errorResponse("فایل نهایی پس از کپی با اطلاعات ثبت‌شده مطابقت ندارد.", 409);
    }

    await removeStagingObject(storage, asset);
    const updated = await pool.query(`UPDATE stored_assets SET status='ready',verified_at=NOW(),finalizing_at=NULL
      WHERE id=$1 AND status='finalizing' AND upload_etag=$2 RETURNING id`, [asset.id, asset.upload_etag]);
    if (!updated.rowCount) {
      const latest = await pool.query("SELECT status FROM stored_assets WHERE id=$1", [asset.id]);
      if (latest.rows[0]?.status !== "ready") return errorResponse("وضعیت فایل هم‌زمان تغییر کرده است.", 409);
    }
    return jsonResponse({ assetId: Number(asset.id), status: "ready", message: "فایل با موفقیت کپی، بررسی و تأیید شد." });
  } catch (error) {
    const response = mapStorageProviderError("completion", error);
    if (response) return response;
    logStorageFailure("completion", error);
    throw error;
  }
}


const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedPOST as POST };
