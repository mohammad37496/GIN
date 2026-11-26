import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  outputFileTracingIncludes: {
    "/*": ["./migrations/**/*.sql"],
  },
  async redirects() {
    return [
      { source: "/our-events", destination: "/events", permanent: true },
      { source: "/membership-levels", destination: "/membership", permanent: true },
      { source: "/contact-us", destination: "/contact", permanent: true },
      { source: "/become-a-member", destination: "/register", permanent: true },
      { source: "/gin-hotels", destination: "/hotels", permanent: true },
      { source: "/gin-clubhouses", destination: "/clubhouses", permanent: true },
      { source: "/gin-cruise-ship", destination: "/cruise", permanent: true },
    ];
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      ],
    }];
  },
};

export default nextConfig;
