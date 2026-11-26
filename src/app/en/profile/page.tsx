import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureSchema, pool } from "@/lib/db";
import { EnglishProfileForm } from "@/components/english-member-controls";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account Profile", description: "Manage your GIN portal contact information and preferred language.", robots: { index: false, follow: false }, alternates: { canonical: "/en/profile", languages: { en: "/en/profile", fa: "/fa/profile" } } };

export default async function EnglishProfilePage() {
  const user = await getSession();
  if (!user) redirect("/en/login?next=%2Fen%2Fprofile");
  await ensureSchema();
  await pool.query("INSERT INTO user_profiles(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING", [user.id]);
  return <EnglishProfileForm />;
}
