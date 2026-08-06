import type { MetadataRoute } from "next";
import { ALL_CURRENCIES } from "@/lib/currencies";
import { siteUrl } from "@/lib/site";

/**
 * Only the public pages. `/history`, `/alerts` and `/recurring` sit behind a
 * login and hold one person's records, so listing them would invite crawlers
 * to a redirect and say nothing useful about the site.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticPages = ["", "/rates", "/login"].map((path) => ({
    url: `${siteUrl()}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const currencyPages = ALL_CURRENCIES.map((currency) => ({
    url: `${siteUrl()}/rates/${currency.code}`,
    lastModified: now,
    // Prices move constantly, but the page itself does not.
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...currencyPages];
}
