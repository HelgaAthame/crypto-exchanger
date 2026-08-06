import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Behind a login, and per-person: nothing for a crawler to index, and
      // following them only produces redirects.
      disallow: ["/history", "/alerts", "/recurring", "/exchange/", "/api/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
