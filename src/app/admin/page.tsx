import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminUsers from "@/components/admin-users";
import AdminPassword from "@/components/admin-password";
import { ShieldCheck, LogOut } from "lucide-react";

export default async function AdminPage(){const user=await getSession();if(!user)redirect("/login");if(user.role!=="admin")redirect("/dashboard");return <main className="dashboard"><header className="dash-header"><Link href="/" className="brand"><span className="brand-mark">G</span> GIN <span className="admin-tag">ADMIN</span></Link><form action="/api/auth/logout" method="post"><button className="logout-button"><LogOut size={16}/> خروج</button></form></header><section className="admin-intro"><div className="auth-icon"><ShieldCheck/></div><div><span className="eyebrow">CONTROL CENTER</span><h1>مدیریت اعضا</h1><p>درخواست‌های عضویت را بررسی و دسترسی کاربران را مدیریت کنید.</p></div></section><AdminPassword/><AdminUsers/></main>}
