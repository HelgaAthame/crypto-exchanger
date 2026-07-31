"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n/context";

export type Crumb = {
  label: string;
  /** Omitted on the current page, which is not a link. */
  href?: string;
};

function absolute(href: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://crypto-exchanger.example";
  return new URL(href, base).toString();
}

/**
 * Visible breadcrumb trail plus a schema.org BreadcrumbList in JSON-LD, the
 * format Google recommends for breadcrumb rich results.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = useT();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: absolute(item.href) } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // Serialised app-controlled data, not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label={t("breadcrumb.label")} className="mb-5">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-muted">
          {items.map((item, i) => (
            <li key={item.label} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="size-3 text-muted/60" aria-hidden />
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="rounded px-1 py-0.5 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="px-1 py-0.5 font-medium text-foreground">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
