import bcrypt from "bcryptjs";
import { z } from "zod";
import { ensureSchema,inTransaction,isDatabaseUnavailableError } from "@/lib/db";
import { errorResponse, jsonResponse } from "@/lib/http";
import { enforceRateLimit, rejectCrossOriginMutation } from "@/lib/request-security";

const schema = z.object({ username: z.string().trim().min(3).max(32).regex(/^[a-zA-Z0-9_.-]+$/), password: z.string().min(10).max(72), referralCode:z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6,32}$/).optional() });

export async function POST(request: Request) {
  try {
    const originError = rejectCrossOriginMutation(request);
    if (originError) return originError;
    await ensureSchema();
    const rateLimit = await enforceRateLimit(request, "register", 5, 3600);
    if (rateLimit) return rateLimit;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorResponse("نام کاربری باید ۳ تا ۳۲ نویسه و رمز عبور حداقل ۱۰ نویسه باشد.");
    const { username, password,referralCode } = parsed.data;
    const hash = await bcrypt.hash(password, 12);
    await inTransaction(async(client)=>{
      const affiliate=referralCode?await client.query("SELECT id,user_id FROM affiliate_accounts WHERE referral_code=$1 AND status='active'",[referralCode]):null;
      if(referralCode&&!affiliate?.rowCount)throw Object.assign(new Error("کد معرف معتبر یا فعال نیست."),{code:"INVALID_REFERRAL"});
      const created=await client.query("INSERT INTO users(username,username_normalized,password_hash) VALUES($1,$2,$3) RETURNING id",[username,username.toLowerCase(),hash]);
      const userId=Number(created.rows[0].id);
      if(affiliate?.rowCount){
        if(Number(affiliate.rows[0].user_id)===userId)throw Object.assign(new Error("ارجاع به حساب خود مجاز نیست."),{code:"SELF_REFERRAL"});
        await client.query("INSERT INTO referral_attributions(affiliate_id,referred_user_id,referral_code) VALUES($1,$2,$3)",[affiliate.rows[0].id,userId,referralCode]);
        await client.query("INSERT INTO notifications(user_id,type,title,body,href) VALUES($1,'referral_signup','ثبت‌نام از لینک معرفی','یک درخواست عضویت جدید از کد معرفی شما ثبت شد.','/dashboard')",[affiliate.rows[0].user_id]);
      }
      await client.query("INSERT INTO audit_logs(action,entity_type,entity_id,metadata) VALUES('member_registered','user',$1,$2::jsonb)",[userId,JSON.stringify({referred:Boolean(affiliate?.rowCount)})]);
    });
    return jsonResponse({ message: "درخواست ثبت‌نام شما ثبت شد. پس از تأیید مدیر می‌توانید وارد شوید." }, 201);
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return errorResponse("این نام کاربری قبلاً ثبت شده است.", 409);
    if (error instanceof Error && "code" in error && (error.code === "INVALID_REFERRAL" || error.code === "SELF_REFERRAL")) return errorResponse(error.message || "کد معرف معتبر نیست.", 400);
    return errorResponse("ثبت‌نام در حال حاضر انجام نشد.", isDatabaseUnavailableError(error) ? 503 : 500);
  }
}
