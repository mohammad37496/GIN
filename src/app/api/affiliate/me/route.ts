import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";
import { errorResponse,jsonResponse } from "@/lib/http";

export async function GET(){const user=await getSession();if(!user)return errorResponse("ابتدا وارد شوید.",401);try{await ensureSchema();const affiliate=await pool.query("SELECT id,referral_code,status,created_at FROM affiliate_accounts WHERE user_id=$1",[user.id]);if(!affiliate.rowCount)return jsonResponse({affiliate:null,balances:[],commissions:[],payouts:[],attributions:[]});const id=affiliate.rows[0].id;const [balances,commissions,payouts,attributions,clicks]=await Promise.all([
  pool.query(`SELECT currency,SUM(CASE WHEN entry_type IN ('credit','reversal') THEN amount_minor ELSE -amount_minor END)::bigint AS balance_minor FROM affiliate_wallet_entries WHERE affiliate_id=$1 GROUP BY currency`,[id]),
  pool.query(`SELECT c.id,c.amount_minor,c.currency,c.status,c.created_at,o.public_id AS order_id FROM affiliate_commissions c JOIN orders o ON o.id=c.order_id WHERE c.affiliate_id=$1 ORDER BY c.created_at DESC LIMIT 100`,[id]),
  pool.query("SELECT id,amount_minor,currency,status,requested_at,paid_reference FROM affiliate_payouts WHERE affiliate_id=$1 ORDER BY requested_at DESC LIMIT 50",[id]),
  pool.query("SELECT COUNT(*)::int AS count FROM referral_attributions WHERE affiliate_id=$1",[id]),
  pool.query("SELECT COUNT(*)::int AS count FROM affiliate_clicks WHERE affiliate_id=$1",[id]),
]);return jsonResponse({affiliate:affiliate.rows[0],referralUrl:`${process.env.APP_URL||""}/register?ref=${affiliate.rows[0].referral_code}`,balances:balances.rows,commissions:commissions.rows,payouts:payouts.rows,attributedMembers:attributions.rows[0].count,clicks:clicks.rows[0].count});}catch{return errorResponse("دریافت اطلاعات همکاری در فروش انجام نشد.",503);}}
