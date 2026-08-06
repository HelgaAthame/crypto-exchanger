/**
 * The site's own origin.
 *
 * Vercel exposes the deployment host but not a full URL, so it is assembled
 * here; `NEXT_PUBLIC_SITE_URL` wins when set, which is what pins preview
 * deployments to the real domain in metadata.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
