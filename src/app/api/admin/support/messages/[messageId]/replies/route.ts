import { z } from "zod";
import { getSession,hasRole } from "@/lib/auth";
import { ensureSchema,inTransaction } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";
import { rejectCrossOriginMutation } from "@/lib/request-security";
import { withApiErrorBoundary } from "@/lib/api-error-boundary";

const schema=z.object({body:z.string().trim().min(2).max(10000),resolve:z.boolean().default(false)});
 async function POST(request:Request,{params}:{params:Promise<{messageId:string}>}){const originError=rejectCrossOriginMutation(request);if(originError)return originError;const user=await getSession();if(!user||!(await hasRole(user,"support")))return errorResponse("دسترسی پشتیبانی ندارید.",403);const id=Number((await params).messageId);if(!Number.isSafeInteger(id)||id<1)return errorResponse("پیام پیدا نشد.",404);const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return errorResponse("متن پاسخ معتبر نیست.");try{await ensureSchema();const result=await inTransaction(async(client)=>{const message=await client.query("SELECT user_id,status FROM support_messages WHERE id=$1 FOR UPDATE",[id]);if(!message.rowCount||message.rows[0].status==='closed')return null;const reply=await client.query("INSERT INTO support_replies(message_id,author_id,is_staff,body) VALUES($1,$2,TRUE,$3) RETURNING id,body,created_at",[id,user.id,parsed.data.body]);await client.query("UPDATE support_messages SET status=$1,assigned_to=$2,updated_at=NOW() WHERE id=$3",[parsed.data.resolve?'resolved':'in_progress',user.id,id]);await client.query("INSERT INTO notifications(user_id,type,title,body,href) VALUES($1,'support_reply','پاسخ جدید از پشتیبانی',$2,'/support')",[message.rows[0].user_id,parsed.data.body.slice(0,300)]);await client.query("INSERT INTO audit_logs(actor_id,action,entity_type,entity_id) VALUES($1,'support_reply_sent','support_message',$2)",[user.id,id]);return reply.rows[0];});if(!result)return errorResponse("پیام پیدا نشد یا بسته شده است.",404);return jsonResponse({reply:result,message:"پاسخ پشتیبانی ارسال شد."},201);}catch{return errorResponse("ارسال پاسخ پشتیبانی انجام نشد.",503);}}


const wrappedPOST = withApiErrorBoundary(POST);
export { wrappedPOST as POST };
