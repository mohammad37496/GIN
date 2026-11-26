import Image from "next/image";
import { ginHotelImages } from "@/lib/gin-hotels";

export default function EnglishHotelGallery() {
  return <section className="gin-en-hotel-gallery" aria-label="GIN hotel gallery">
    <h2>Hotels Featured in the GIN Gallery</h2>
    <p>These 52 captioned images are reproduced from the official GIN hotel gallery. They document venues featured by the organization and do not indicate current availability, sponsorship or endorsement.</p>
    <div className="gin-en-hotel-grid">
      {ginHotelImages.map((hotel) => <figure key={hotel.basename}>
        <Image src={`/gin/hotels/${hotel.uploadYear === 2024 ? "2024-08" : "2022-04"}/${hotel.basename}`} alt={hotel.caption} width={800} height={520} sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 30vw" />
        <figcaption>{hotel.caption}</figcaption>
      </figure>)}
    </div>
  </section>;
}
