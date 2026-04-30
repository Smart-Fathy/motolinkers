"use client";

import { useEffect } from "react";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the actual exception in the Cloudflare worker logs so
    // failures don't silently turn into a plain "Internal Server Error".
    console.error("[site] route render failed:", error);
  }, [error]);

  return (
    <main style={{ paddingTop: "9rem", paddingBottom: "var(--sp-section)" }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <p
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: ".74rem",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            color: "var(--volt)",
            margin: "0 0 1rem",
          }}
        >
          Something broke
        </p>
        <h1
          style={{
            fontFamily: "var(--ff-display)",
            fontWeight: 300,
            fontSize: "clamp(2rem, 4vw, 3.2rem)",
            lineHeight: 1.05,
            letterSpacing: "-.03em",
            color: "var(--bone)",
            margin: "0 0 1.4rem",
          }}
        >
          We couldn&rsquo;t render this page.
        </h1>
        <p style={{ color: "var(--stone)", lineHeight: 1.6, margin: "0 0 2rem" }}>
          The page hit an unexpected error. Try again, or head back to the
          home page.
        </p>
        {error.digest && (
          <p
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: ".72rem",
              color: "var(--stone)",
              margin: "0 0 2rem",
            }}
          >
            Reference: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: "0.7rem" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: ".8rem",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              padding: ".7rem 1.2rem",
              borderRadius: 999,
              border: "1px solid var(--line)",
              background: "var(--volt)",
              color: "var(--ink)",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: ".8rem",
              letterSpacing: ".1em",
              textTransform: "uppercase",
              padding: ".7rem 1.2rem",
              borderRadius: 999,
              border: "1px solid var(--line)",
              color: "var(--bone)",
              textDecoration: "none",
            }}
          >
            Home
          </a>
        </div>
      </div>
    </main>
  );
}
