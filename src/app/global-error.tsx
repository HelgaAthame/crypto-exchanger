"use client";

/**
 * Catches errors thrown in the root layout itself, where the normal error
 * boundary has no shell to render into — so this file ships its own <html>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#08080a",
          color: "#f2efe6",
          fontFamily: "system-ui, sans-serif",
          padding: "1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "26rem" }}>
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#d4af37",
            }}
          >
            Crypto Exchanger
          </p>
          <h1 style={{ marginTop: "0.75rem", fontSize: "1.35rem" }}>
            The app failed to load
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#9c968a" }}>
            An unexpected error occurred before the page could render.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: "0.75rem",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#9c968a",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              cursor: "pointer",
              borderRadius: "0.75rem",
              border: "none",
              padding: "0.8rem 1.4rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#000",
              background: "linear-gradient(135deg, #f4e2a1, #c9992f, #7a5a17)",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
