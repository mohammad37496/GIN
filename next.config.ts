import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.GIN_NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  outputFileTracingIncludes: {
    "/*": ["./migrations/**/*.sql"],
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
