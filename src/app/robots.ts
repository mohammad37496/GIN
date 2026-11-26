import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/structured-data";

const siteUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/dashboard", "/profile", "/affiliate", "/finance-center", "/instructor", "/events-manager", "/support-center", "/login", "/register", "/support", "/en/login", "/en/register", "/en/dashboard", "/en/profile", "/en/support", "/en/admin", "/en/affiliate", "/en/finance-center", "/en/instructor", "/en/events-manager", "/en/support-center", "/fa/login", "/fa/register", "/fa/dashboard", "/fa/profile", "/fa/support", "/fa/admin", "/fa/affiliate", "/fa/finance-center", "/fa/instructor", "/fa/events-manager", "/fa/support-center"],
    }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
