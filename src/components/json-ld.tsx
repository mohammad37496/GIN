import { serializeJsonLd } from "@/lib/structured-data";

export default function JsonLd({ data }: { data: unknown | unknown[] }) {
  const payload = Array.isArray(data) ? data.filter(Boolean) : data;
  if (!payload || (Array.isArray(payload) && payload.length === 0)) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(payload) }} />;
}
