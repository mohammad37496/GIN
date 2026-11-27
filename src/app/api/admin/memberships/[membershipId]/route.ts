import { withApiErrorBoundary } from "@/lib/api-error-boundary";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { cancelAdminMembership } from "@/lib/admin-membership-cancellation";

const schema=z.object({status:z.enum(["canceled","expired"]),reason:z.string().trim().max(500).default("")});

async function PATCH(request:Request,{params}:{params:Promise<{membershipId:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await requireAdmin();if(!admin)return errorResponse("دسترسی غیرمجاز است.",403);
  const id=Number((await params).membershipId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("عضویت پیدا نشد.",404);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("وضعیت عضویت معتبر نیست.");
  try{await ensureSchema();const result=await inTransaction((client)=>cancelAdminMembership(client,{membershipId:id,status:parsed.data.status,reason:parsed.data.reason,actorId:admin.id}));
    if(!result)return errorResponse("عضویت فعال یا در انتظار پیدا نشد.",404);
    return jsonResponse({membership:result,message:"وضعیت عضویت تغییر کرد و دسترسی‌های وابسته بازبینی شد."});
  }catch{return errorResponse("تغییر وضعیت عضویت انجام نشد.",503);}
}

const wrappedPATCH = withApiErrorBoundary(PATCH);
export { wrappedPATCH as PATCH };
