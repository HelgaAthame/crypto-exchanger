import { ImageResponse } from "next/og";

export const alt = "Crypto Exchanger — live fiat and crypto exchange calculator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card people actually see when the link is pasted into a chat.
 *
 * Drawn rather than loaded: a static file would have to be re-exported every
 * time the brand moves, and this stays in step with the same gold-on-black
 * palette the site uses. Satori supports a subset of CSS — no external fonts,
 * no `oklch`, no CSS variables — so the colours are written out in full here.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08080a",
          padding: 72,
          position: "relative",
        }}
      >
        {/* Gold glow, echoing the hero backdrop. */}
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -160,
            width: 640,
            height: 640,
            borderRadius: 999,
            background: "radial-gradient(circle, #c9992f 0%, rgba(122,90,23,0) 70%)",
            opacity: 0.5,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* The mark: a gold ring with an E, built from boxes. */}
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 999,
              border: "7px solid #d4af37",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f4e2a1",
              fontSize: 44,
              fontWeight: 700,
            }}
          >
            E
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: "#f2efe6", fontSize: 34, fontWeight: 600 }}>
              Crypto Exchanger
            </div>
            <div style={{ color: "#9c968a", fontSize: 20, letterSpacing: 4 }}>
              LIVE RATES · DEMO
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              color: "#f2efe6",
              fontSize: 68,
              fontWeight: 600,
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            Exchange crypto and fiat,
          </div>
          <div style={{ color: "#e0b84a", fontSize: 68, fontWeight: 600, lineHeight: 1.1 }}>
            instantly priced
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: "1px solid rgba(212,175,55,0.35)",
              color: "#d4af37",
              fontSize: 22,
            }}
          >
            Demo project — no real funds move
          </div>
          <div style={{ color: "#9c968a", fontSize: 22 }}>
            10 currencies · live rates · open source
          </div>
        </div>
      </div>
    ),
    size
  );
}
