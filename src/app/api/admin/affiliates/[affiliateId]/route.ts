import { z } from "zod";
import { canManageAffiliates,getSession } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";


const schema=z.object({status:z.enum(["active","suspended"])});

 async function PATCH(request:Request,{params}:{params:Promise<{affiliateId:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await getSession();if(!admin||!(await canManageAffiliates(admin)))return errorResponse("دسترسی مدیریت همکاری در فروش ندارید.",403);
  const id=Number((await params).affiliateId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("حساب همکاری پیدا نشد.",404);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("وضعیت حساب معتبر نیست.");
  try{
    await ensureSchema();
    const affiliate=await inTransaction(async(client)=>{
      const updated=await client.query("UPDATE affiliate_accounts SET status=$1::varchar WHERE id=$2 RETURNING id,status,user_id",[parsed.data.status,id]);
      if(!updated.rowCount)return null;
      await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id,metadata) VALUES($1,$2,'affiliate_account',$3,$4::jsonb)",
        [admin.id,`affiliate_${parsed.data.status}`,id,JSON.stringify({userId:updated.rows[0].user_id})]);
      return updated.rows[0];
    });
    if(!affiliate)return errorResponse("حساب همکاری پیدا نشد.",404);
    return jsonResponse({affiliate,message:"وضعیت حساب همکاری تغییر کرد."});
  }catch{return errorResponse("تغییر وضعیت حساب همکاری انجام نشد.",503);}
}


const wrappedPATCH = withApiErrorBoundary(PATCH);
export { wrappedPATCH as PATCH };
