import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureSchema, pool } from "@/lib/db";
import PublicHeader from "@/components/public-header";
import PublicFooter from "@/components/public-footer";
import { GinMark } from "@/components/gin-brand";

export const dynamic = "force-dynamic";

export default async function CertificatePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(publicId)) notFound();
  await ensureSchema();
  const result = await pool.query(`SELECT ce.public_id,ce.serial_number,ce.issued_at,ce.revoked_at,c.title AS course_title
    FROM certificates ce JOIN courses c ON c.id=ce.course_id WHERE ce.public_id=$1`, [publicId]);
  const certificate = result.rows[0];
  if (!certificate) notFound();
  return <><PublicHeader/><main className="certificate-page"><article className="certificate-sheet"><span className="eyebrow">GLOBAL INFORMATION NETWORK</span><div className="certificate-mark"><GinMark size={90}/></div><h1>گواهی پایان دوره</h1><p>این گواهی تأیید می‌کند که یک عضو GIN با موفقیت الزامات آموزشی دوره زیر را تکمیل کرده است.</p><h2>{certificate.course_title}</h2><div className="certificate-meta"><span>شماره گواهی</span><strong dir="ltr">{certificate.serial_number}</strong><span>تاریخ صدور</span><strong>{new Date(certificate.issued_at).toLocaleDateString("fa-IR")}</strong></div><div className={`certificate-validity ${certificate.revoked_at ? "invalid" : "valid"}`}>{certificate.revoked_at ? "این گواهی لغو شده است" : "گواهی معتبر و قابل استعلام است"}</div><small>شناسه استعلام: {certificate.public_id}</small><p className="certificate-print-note">برای ذخیره نسخه PDF، از فرمان چاپ مرورگر استفاده کنید.</p><Link href={`/api/certificates/${certificate.public_id}`} className="text-arrow">مشاهده اطلاعات استعلام</Link></article></main><PublicFooter/></>;
}
