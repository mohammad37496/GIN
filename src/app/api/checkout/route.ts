import { z } from "zod";
import { getSession } from "@/lib/auth";
import { errorResponse,jsonResponse } from "@/lib/http";
import { getConfiguredPaymentProvider,paymentProviderStatus } from "@/lib/payments/provider";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema=z.object({itemType:z.enum(["membership","course","event"]),itemId:z.number().int().positive(),idempotencyKey:z.string().trim().min(16).max(160)});
export async function POST(request:Request){const originError=rejectCrossOriginMutation(request);if(originError)return originError;const user=await getSession();if(!user)return errorResponse("برای ادامه خرید وارد شوید.",401);const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("اطلاعات سفارش معتبر نیست.");const provider=getConfiguredPaymentProvider();if(!provider)return jsonResponse({error:"درگاه پرداخت انتخاب و پیکربندی نشده است؛ هیچ سفارش یا تراکنشی ایجاد نشده است.",code:"PAYMENT_PROVIDER_NOT_CONFIGURED",provider:paymentProviderStatus()},503);return jsonResponse({error:"اتصال این درگاه هنوز کامل نشده است.",code:"PAYMENT_ADAPTER_UNAVAILABLE",item:parsed.data,userId:user.id},503);}
