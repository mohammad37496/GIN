import { canManageAffiliates,canManageFinance,getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";

export async function GET(){
  const admin=await getSession();
  if(!admin)return errorResponse("دسترسی مالی یا همکاری در فروش ندارید.",403);
  const affiliateAccess=await canManageAffiliates(admin);
  const financeAccess=await canManageFinance(admin);
  if(!affiliateAccess&&!financeAccess)return errorResponse("دسترسی مالی یا همکاری در فروش ندارید.",403);
  try{
    await ensureSchema();
    const [accounts,commissions,payouts]=await Promise.all([
      affiliateAccess?pool.query(`SELECT a.id,a.user_id,a.referral_code,a.status,a.created_at,u.username,
        COUNT(DISTINCT ra.id)::int AS referrals FROM affiliate_accounts a JOIN users u ON u.id=a.user_id
        LEFT JOIN referral_attributions ra ON ra.affiliate_id=a.id GROUP BY a.id,u.username ORDER BY a.created_at DESC LIMIT 500`):Promise.resolve({rows:[]}),
      affiliateAccess?pool.query(`SELECT c.id,c.affiliate_id,c.amount_minor,c.currency,c.status,c.created_at,u.username
        FROM affiliate_commissions c JOIN affiliate_accounts a ON a.id=c.affiliate_id
        JOIN users u ON u.id=a.user_id ORDER BY c.created_at DESC LIMIT 500`):Promise.resolve({rows:[]}),
      financeAccess?pool.query(`SELECT p.id,p.affiliate_id,p.amount_minor,p.currency,p.status,p.payout_details,p.requested_at,u.username
        FROM affiliate_payouts p JOIN affiliate_accounts a ON a.id=p.affiliate_id
        JOIN users u ON u.id=a.user_id ORDER BY p.requested_at DESC LIMIT 300`):Promise.resolve({rows:[]}),
    ]);
    return jsonResponse({accounts:accounts.rows,commissions:commissions.rows,payouts:payouts.rows,permissions:{affiliateAccess,financeAccess}});
  }catch{return errorResponse("دریافت گزارش همکاری در فروش انجام نشد.",503);}
}
