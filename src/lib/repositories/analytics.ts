"use server";

import { cookies, headers } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";
import {
  readSession,
  setSessionCookies,
  type SessionPair,
} from "@/lib/cookies";

// recordPageEvent — server action invoked by the client beacon on
// every public page render. We don't need an async result on the
// client (fire-and-forget), but we still return a small success
// flag so the caller can debug without hitting the Network tab.
//
// The insert path uses the cookieless public client. RLS allows
// anon inserts on page_events. The vehicle slug is derived from the
// path here rather than passed by the caller, so the beacon stays
// dumb.
export async function recordPageEvent(
  path: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!path || typeof path !== "string") {
      return { ok: false, error: "missing-path" };
    }

    const cookieStore = await cookies();
    const headerStore = await headers();
    const session = readSession(cookieStore);
    setSessionCookies(cookieStore, session);

    const ua = headerStore.get("user-agent") ?? "";
    const referer = headerStore.get("referer") ?? "";
    const country =
      headerStore.get("cf-ipcountry") ??
      headerStore.get("x-vercel-ip-country") ??
      null;
    const region =
      headerStore.get("cf-region") ??
      headerStore.get("x-vercel-ip-country-region") ??
      null;
    const city =
      headerStore.get("cf-ipcity") ??
      headerStore.get("x-vercel-ip-city") ??
      null;

    const cleanPath = normalisePath(path);
    const vehicleSlug = extractVehicleSlug(cleanPath);

    const supabase = createPublicClient();
    const { error } = await supabase.from("page_events").insert({
      session_id: session.sessionId,
      path: cleanPath,
      vehicle_slug: vehicleSlug,
      country: country ? country.toUpperCase().slice(0, 2) : null,
      region: region ? region.slice(0, 80) : null,
      city: city ? decodeMaybe(city).slice(0, 120) : null,
      device: classifyDevice(ua),
      referrer_kind: classifyReferrer(referer),
      is_new_visitor: session.isNewVisitor,
    });
    if (error) {
      console.error("[analytics] insert error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.error("[analytics] recordPageEvent threw:", e);
    return { ok: false, error: "internal" };
  }
}

// ─── helpers ───────────────────────────────────────────────────────

// Strip query strings, fragments, and trailing slashes so /vehicles
// and /vehicles?sort=newest count as the same page. Truncate to a
// sensible length.
function normalisePath(p: string): string {
  let out = p;
  const q = out.indexOf("?");
  if (q !== -1) out = out.slice(0, q);
  const h = out.indexOf("#");
  if (h !== -1) out = out.slice(0, h);
  if (out.length > 1 && out.endsWith("/")) out = out.slice(0, -1);
  return out.slice(0, 200) || "/";
}

// /vehicles/<slug>  → "<slug>"
// /vehicles         → null
// /                 → null
function extractVehicleSlug(path: string): string | null {
  const m = path.match(/^\/vehicles\/([^/]+)$/);
  return m ? m[1] : null;
}

function decodeMaybe(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

// User-agent classification — minimal, no external dep. Tablet wins
// over mobile (e.g. iPad UA contains both signals); desktop is the
// fallback when neither matches.
function classifyDevice(ua: string): "mobile" | "tablet" | "desktop" {
  const u = ua.toLowerCase();
  if (/ipad|tablet|kindle|playbook|silk/.test(u)) return "tablet";
  if (/mobi|iphone|android|ipod|blackberry|windows phone/.test(u)) return "mobile";
  return "desktop";
}

// Referrer classification by hostname:
// - empty/internal → direct
// - known search engines → search
// - known social platforms → social
// - everything else → other
function classifyReferrer(referer: string): "direct" | "search" | "social" | "other" {
  if (!referer) return "direct";
  let host = "";
  try {
    host = new URL(referer).hostname.toLowerCase();
  } catch {
    return "other";
  }
  // Strip leading "www." and a trailing "."  (the latter happens with
  // some browsers' canonical URL forms).
  host = host.replace(/^www\./, "").replace(/\.$/, "");

  // Treat motolinkers.com (any subdomain) as direct — it's an
  // intra-site nav, not an external referral.
  if (host.endsWith("motolinkers.com")) return "direct";

  if (
    host.includes("google.") ||
    host === "bing.com" ||
    host.endsWith(".bing.com") ||
    host.includes("duckduckgo.") ||
    host.includes("yandex.") ||
    host.includes("baidu.")
  ) {
    return "search";
  }
  if (
    host.endsWith("facebook.com") ||
    host === "fb.com" ||
    host.endsWith(".fb.me") ||
    host.endsWith("instagram.com") ||
    host.endsWith("tiktok.com") ||
    host.endsWith("twitter.com") ||
    host === "x.com" ||
    host.endsWith(".x.com") ||
    host.endsWith("linkedin.com") ||
    host.endsWith("reddit.com") ||
    host.endsWith("youtube.com") ||
    host.endsWith("threads.net")
  ) {
    return "social";
  }
  return "other";
}

// Re-export for unit-test access if we add tests later.
export type { SessionPair };
