import { z } from "zod";
import { canManageAffiliates,getSession } from "@/lib/auth";
import { ensureSchema,inTransaction,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";

const schema=z.object({name:z.string().trim().min(2).max(120),itemType:z.enum(["membership","course","event"]),rateBasisPoints:z.number().int().min(0).max(10000),fixedMinor:z.number().int().min(0).max(9000000000).default(0),currency:z.string().regex(/^[A-Z]{3}$/).optional(),startsAt:z.string().datetime().optional(),endsAt:z.string().datetime().nullable().optional()});

export async function GET(){
  const admin=await getSession();if(!admin||!(await canManageAffiliates(admin)))return errorResponse("دسترسی مدیریت همکاری در فروش ندارید.",403);
  try{await ensureSchema();const result=await pool.query("SELECT * FROM commission_rules ORDER BY created_at DESC NULLS LAST,id DESC");return jsonResponse({rules:result.rows});}
  catch{return errorResponse("دریافت قوانین کمیسیون انجام نشد.",503);}
}

export async function POST(request:Request){
  const originError=rejectCrossOriginMutation(request);if(originError)return originError;
  const admin=await getSession();if(!admin||!(await canManageAffiliates(admin)))return errorResponse("دسترسی مدیریت همکاری در فروش ندارید.",403);
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("اطلاعات قانون کمیسیون معتبر نیست.");
  const d=parsed.data;const starts=d.startsAt?new Date(d.startsAt):new Date();const ends=d.endsAt?new Date(d.endsAt):null;
  if(ends&&ends<=starts)return errorResponse("پایان اعتبار قانون باید بعد از شروع باشد.");
  try{
    await ensureSchema();
    const rule=await inTransaction(async(client)=>{
      const inserted=await client.query(`INSERT INTO commission_rules(name,item_type,rate_basis_points,fixed_minor,currency,starts_at,ends_at)
        VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id,name,item_type,rate_basis_points,fixed_minor,currency,is_active`,
      [d.name,d.itemType,d.rateBasisPoints,d.fixedMinor,d.currency??null,starts.toISOString(),ends?.toISOString()??null]);
      await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id) VALUES($1,'commission_rule_created','commission_rule',$2)",[admin.id,inserted.rows[0].id]);
      return inserted.rows[0];
    });
    return jsonResponse({rule,message:"قانون کمیسیون ایجاد شد."},201);
  }catch{return errorResponse("ساخت قانون کمیسیون انجام نشد.",503);}
}
