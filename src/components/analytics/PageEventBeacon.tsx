"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { recordPageEvent } from "@/lib/repositories/analytics";

// Fires a page-view event once per pathname change. The vehicle slug
// is derived server-side from the path itself, so the beacon stays
// minimal — one component, no per-page wiring.
//
// Suppression rules:
//   - skip when running locally on localhost (we don't want dev noise)
//   - skip when navigator.doNotTrack === "1"
//   - skip on bot-ish user agents (Googlebot et al — best-effort)
//
// The dedupe `lastFired` ref guards against React 18 Strict Mode's
// double useEffect in development; it's harmless in production but
// would otherwise log two events per page in dev.

export default function PageEventBeacon() {
  const pathname = usePathname();
  const lastFired = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathname) return;

    // Local dev — don't pollute production analytics.
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return;
    }

    // Respect Do Not Track.
    if (navigator.doNotTrack === "1") return;

    // Cheap bot filter. Skip anything that looks crawler-shaped.
    if (/bot|spider|crawler|crawling|googlebot|bingbot/i.test(navigator.userAgent)) {
      return;
    }

    if (lastFired.current === pathname) return;
    lastFired.current = pathname;

    void recordPageEvent(pathname);
  }, [pathname]);

  return null;
}
