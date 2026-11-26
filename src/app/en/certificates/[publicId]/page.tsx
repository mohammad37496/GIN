import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GinMark } from "@/components/gin-brand";
import { ensureSchema, pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Certificate Verification", robots: { index: false, follow: false } };
}

export default async function EnglishCertificatePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(publicId)) notFound();
  await ensureSchema();
  const result = await pool.query(`SELECT ce.public_id,ce.serial_number,ce.issued_at,ce.revoked_at,c.title AS course_title
    FROM certificates ce JOIN courses c ON c.id=ce.course_id WHERE ce.public_id=$1`, [publicId]);
  const certificate = result.rows[0];
  if (!certificate) notFound();

  return <article className="gin-en-page gin-en-certificate">
    <div className="gin-en-certificate-sheet">
      <span className="gin-en-course-kicker">GLOBAL INFORMATION NETWORK</span>
      <div className="gin-en-certificate-mark"><GinMark size={84} /></div>
      <h1>Certificate of Completion</h1>
      <p>This certificate confirms that a GIN learning portal member has completed the published requirements for the following course:</p>
      <h2>{certificate.course_title}</h2>
      <div className="gin-en-certificate-meta"><span>Certificate Number</span><strong>{certificate.serial_number}</strong><span>Date Issued</span><strong>{new Date(certificate.issued_at).toLocaleDateString("en-US", { dateStyle: "long" })}</strong></div>
      <p className={`gin-en-certificate-validity ${certificate.revoked_at ? "invalid" : "valid"}`}>{certificate.revoked_at ? "This certificate has been revoked." : "This certificate is valid and can be verified."}</p>
      <small>Verification ID: {certificate.public_id}</small>
      <p className="gin-en-form-disclaimer">Use the verification endpoint to confirm the current certificate status.</p>
      <div className="gin-en-cta"><Link className="gin-en-button gin-en-button-alt" href={`/api/certificates/${certificate.public_id}`}>View verification data</Link><Link className="gin-en-button" href="/en/dashboard">Back to dashboard</Link></div>
    </div>
  </article>;
}
