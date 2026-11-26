import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/http";

const schema = z.object({ filename: z.string().min(1).max(180), contentType: z.string().regex(/^(image\/(jpeg|png|webp|gif)|application\/pdf|video\/mp4)$/), size: z.number().int().positive().max(25 * 1024 * 1024) });

export async function POST(request: Request) {
  const user = await getSession();
  if (!user) return errorResponse("برای بارگذاری فایل ابتدا وارد شوید.", 401);
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("نوع یا اندازه فایل مجاز نیست.");
  const { S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) return errorResponse("فضای ذخیره‌سازی هنوز پیکربندی نشده است.", 503);
  const client = new S3Client({ region: process.env.S3_REGION || "default", endpoint: S3_ENDPOINT, forcePathStyle: true, credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY } });
  const extension = parsed.data.filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const key = `uploads/${user.id}/${randomUUID()}.${extension}`;
  const command = new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: parsed.data.contentType, ContentLength: parsed.data.size });
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
  return jsonResponse({ uploadUrl, key, publicUrl: process.env.S3_PUBLIC_URL ? `${process.env.S3_PUBLIC_URL.replace(/\/$/, "")}/${key}` : null, expiresIn: 300 });
}
