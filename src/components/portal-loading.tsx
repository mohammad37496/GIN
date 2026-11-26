export default function PortalLoading({ label = "در حال آماده‌سازی اطلاعات" }: { label?: string }) {
  return (
    <main className="system-page" dir="rtl" aria-live="polite" aria-busy="true">
      <section className="system-card system-loading">
        <span className="system-spinner" aria-hidden="true" />
        <h1>{label}</h1>
        <p>لطفاً چند لحظه صبر کنید.</p>
      </section>
    </main>
  );
}
