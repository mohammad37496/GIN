import { z } from "zod";
import { canManageAffiliates,getSession } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema=z.object({isActive:z.boolean()});

export async function PATCH(request:Request,{params}:{params:Promise<{ruleId:string}>}){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await getSession();if(!admin||!(await canManageAffiliates(admin)))return errorResponse("دسترسی مدیریت همکاری در فروش ندارید.",403);
  const id=Number((await params).ruleId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("قانون پیدا نشد.",404);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("وضعیت قانون معتبر نیست.");
  try{
    await ensureSchema();
    const rule=await inTransaction(async(client)=>{
      const updated=await client.query("UPDATE commission_rules SET is_active=$1 WHERE id=$2 RETURNING id,is_active",[parsed.data.isActive,id]);
      if(!updated.rowCount)return null;
      await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id) VALUES($1,'commission_rule_toggled','commission_rule',$2)",[admin.id,id]);
      return updated.rows[0];
    });
    if(!rule)return errorResponse("قانون پیدا نشد.",404);
    return jsonResponse({rule,message:"وضعیت قانون تغییر کرد."});
  }catch{return errorResponse("تغییر قانون کمیسیون انجام نشد.",503);}
}
