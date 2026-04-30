"use client";

import { useEffect } from "react";

// Last-chance error boundary — catches errors that escape the (site)
// layout (e.g. a render failure in the root layout itself). Without
// this file Cloudflare workers serve a plain-text "Internal Server
// Error" with no logging.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("[global] root render failed:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#0d0d0d",
          color: "#eee8dc",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <p
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: ".75rem",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              color: "#c8ff3c",
              margin: "0 0 1rem",
            }}
          >
            500 — Server error
          </p>
          <h1 style={{ fontSize: "2rem", margin: "0 0 1rem", fontWeight: 400 }}>
            Something went wrong rendering this page.
          </h1>
          <p style={{ color: "#9a9a8d", margin: "0 0 1.4rem", lineHeight: 1.5 }}>
            The error has been logged. Please try again in a moment.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: ".75rem",
                color: "#9a9a8d",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: "1.5rem",
              padding: ".7rem 1.3rem",
              borderRadius: 999,
              border: "1px solid #2a2a2a",
              color: "#eee8dc",
              textDecoration: "none",
              fontSize: ".85rem",
            }}
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
