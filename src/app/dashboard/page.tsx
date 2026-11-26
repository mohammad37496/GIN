import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BookOpen, LogOut } from "lucide-react";

export default async function Dashboard(){const user=await getSession();if(!user)redirect("/login");if(user.role==="admin")redirect("/admin");return <main className="dashboard"><header className="dash-header"><Link href="/" className="brand"><span className="brand-mark">G</span> GIN</Link><form action="/api/auth/logout" method="post"><button className="logout-button"><LogOut size={16}/> خروج</button></form></header><section className="welcome-panel"><span className="eyebrow">MEMBER SPACE</span><h1>خوش آمدی، {user.username}</h1><p>حساب شما فعال است. به فضای یادگیری GIN خوش آمدید.</p><div className="empty-learning"><BookOpen size={32}/><h2>مسیر یادگیری شما</h2><p>به‌زودی محتوای آموزشی اختصاصی در این بخش قرار می‌گیرد.</p></div></section></main>}
