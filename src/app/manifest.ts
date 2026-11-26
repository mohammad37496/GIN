import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Global Information Network",
    short_name: "GIN",
    description: "شبکه جهانی اطلاعات، یادگیری و ارتباط اعضا.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#173c59",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}
