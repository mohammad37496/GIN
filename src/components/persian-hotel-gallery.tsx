import Image from "next/image";
import { ginHotelImages } from "@/lib/gin-hotels";

export default function PersianHotelGallery() {
  return (
    <section className="persian-hotel-gallery" aria-labelledby="persian-hotel-gallery-title">
      <h2 id="persian-hotel-gallery-title">گالری هتل‌های معرفی‌شده در وب‌سایت GIN</h2>
      <p>نام‌ها و تصاویر زیر از گالری رسمی GIN بازنشر شده‌اند. این فهرست جزئی از محل برگزاری رویدادها و نشست‌های گذشته است و به معنی همکاری جاری، تخفیف یا امکان رزرو نیست.</p>
      <div className="persian-hotel-grid">
        {ginHotelImages.map((hotel) => (
          <figure key={hotel.basename}>
            <Image
              src={`/gin/hotels/${hotel.uploadYear === 2024 ? "2024-08" : "2022-04"}/${hotel.basename}`}
              alt={hotel.caption}
              width={800}
              height={520}
              sizes="(max-width: 580px) 100vw, (max-width: 900px) 50vw, 30vw"
            />
            <figcaption>{hotel.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
