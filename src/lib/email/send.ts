import { siteUrl } from "@/lib/site";

/**
 * Sending is optional, like the database.
 *
 * With no `RESEND_API_KEY` nothing is sent and the caller is told so, rather
 * than the app failing — a clone still runs on an empty environment, and the
 * in-app notification remains the guaranteed channel.
 *
 * Resend's REST endpoint is called directly instead of pulling in the SDK: it
 * is one POST, and a dependency for that is weight the bundle does not need.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Resend's shared sender works with no DNS setup, which suits a demo. */
const DEFAULT_FROM = "Crypto Exchanger <onboarding@resend.dev>";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  if (!isEmailConfigured()) return { sent: false, error: "not-configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? DEFAULT_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!res.ok) return { sent: false, error: `resend-${res.status}` };
    return { sent: true };
  } catch {
    // A failed send must never take the scheduler down with it.
    return { sent: false, error: "network" };
  }
}

/**
 * The alert email. Deliberately plain: one fact, one link, and the same demo
 * disclaimer the site carries, so nobody mistakes it for a trading service.
 */
export function alertEmailHtml(input: {
  pair: string;
  direction: string;
  target: string;
  current: string;
}): string {
  return `
<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#17150f">
  <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a6413;margin:0">
    Crypto Exchanger
  </p>
  <h1 style="font-size:20px;margin:12px 0 4px">${input.pair} is ${input.direction} your target</h1>
  <p style="margin:0 0 16px;color:#6b6659">
    Target ${input.target} · now ${input.current}
  </p>
  <a href="${siteUrl()}/alerts"
     style="display:inline-block;background:#8a6413;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-size:14px">
    View your alerts
  </a>
  <p style="margin:24px 0 0;font-size:12px;color:#6b6659">
    Demo project — no real funds move and nothing was bought on your behalf.
  </p>
</div>`.trim();
}
