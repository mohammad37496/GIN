import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import ProfileForm from "@/components/profile-form";
import { getSession } from "@/lib/auth";
import { ensureSchema,pool } from "@/lib/db";

export const dynamic="force-dynamic";
export const metadata: Metadata = { title: "پروفایل کاربری", robots: { index: false, follow: false }, alternates: { canonical: "/fa/profile", languages: { fa: "/fa/profile", en: "/en/profile" } } };
export default async function ProfilePage(){const user=await getSession();if(!user)redirect("/login?next=%2Fprofile");await ensureSchema();await pool.query("INSERT INTO user_profiles(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING",[user.id]);const result=await pool.query("SELECT display_name,email,phone,locale,timezone FROM user_profiles WHERE user_id=$1",[user.id]);return <><PublicHeader/><main className="profile-page"><div className="public-container"><div className="page-breadcrumb"><Link href="/">خانه</Link><span>/</span><span>پروفایل</span></div><section className="profile-panel"><span className="eyebrow">MEMBER PROFILE</span><h1>اطلاعات حساب کاربری</h1><p>اطلاعات تماس و ترجیح زبان را به‌روز نگه دارید. رمز عبور از بخش امنیت حساب تغییر می‌کند.</p><ProfileForm initial={result.rows[0]}/><Link href="/dashboard" className="text-arrow">بازگشت به داشبورد</Link></section></div></main><PublicFooter/></>}
