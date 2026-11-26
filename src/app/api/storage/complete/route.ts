import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { getSession,hasRole } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { getStorageConfig } from "@/lib/storage";
import { errorResponse,jsonResponse } from "@/lib/http";
import { enforceRateLimit,rejectCrossOriginMutation } from "@/lib/request-security";

const schema=z.object({assetId:z.number().int().positive()});
export async function POST(request:Request){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const user=await getSession();if(!user||!(await hasRole(user,"instructor")))return errorResponse("دسترسی بارگذاری ندارید.",403);
  const limited=await enforceRateLimit(request,"storage-complete",30,3600);if(limited)return limited;
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("شناسه فایل معتبر نیست.");
  const storage=getStorageConfig();if(!storage)return errorResponse("فضای ذخیره‌سازی پیکربندی نشده است.",503);
  try{
    await ensureSchema();
    const result=await pool.query("SELECT id,owner_id,object_key,content_type,size_bytes,status,created_at FROM stored_assets WHERE id=$1",[parsed.data.assetId]);
    const asset=result.rows[0];
    if(!asset||Number(asset.owner_id)!==user.id)return errorResponse("فایل پیدا نشد.",404);
    if(asset.status==='ready')return jsonResponse({assetId:asset.id,status:'ready',message:"فایل قبلاً تأیید شده است."});
    if(asset.status!=='pending'||new Date(asset.created_at).getTime()<Date.now()-15*60*1000)return errorResponse("مهلت بارگذاری فایل به پایان رسیده است.",409);
    const head=await storage.client.send(new HeadObjectCommand({Bucket:storage.bucket,Key:asset.object_key}));
    if(Number(head.ContentLength)!==Number(asset.size_bytes)||head.ContentType!==asset.content_type){
      await pool.query("UPDATE stored_assets SET status='quarantined' WHERE id=$1 AND status='pending'",[asset.id]);
      return errorResponse("مشخصات فایل بارگذاری‌شده با اطلاعات اولیه مطابقت ندارد.",400);
    }
    const updated=await pool.query("UPDATE stored_assets SET status='ready',verified_at=NOW() WHERE id=$1 AND status='pending' RETURNING id",[asset.id]);
    if(!updated.rowCount)return errorResponse("وضعیت فایل هم‌زمان تغییر کرده است.",409);
    return jsonResponse({assetId:Number(asset.id),status:'ready',message:"فایل با موفقیت بررسی و تأیید شد."});
  }catch{return errorResponse("تأیید فایل در فضای ذخیره‌سازی انجام نشد.",503);}
}
