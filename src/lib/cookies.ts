// Visitor + session cookies. Shared by analytics and (later) MotoAgent.
//
//   mlk_v   ─ visitor id, set on first ever visit. 1-year expiry.
//             Used by analytics to flag is_new_visitor and by MotoAgent
//             for cross-conversation continuity.
//   mlk_s   ─ session id, refreshed on each request. 30-min sliding
//             expiry. A "session" is therefore a visit cluster within
//             30 minutes of inactivity.
//
// Both are random v4 UUIDs, http-only is FALSE so the client beacon
// can read them too (they're not sensitive — opaque visitor IDs).

import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const VISITOR_COOKIE = "mlk_v";
export const SESSION_COOKIE = "mlk_s";

export interface SessionPair {
  visitorId: string;
  sessionId: string;
  isNewVisitor: boolean;
}

// Random v4 UUID generated without depending on `crypto.randomUUID`
// being available in every runtime — Cloudflare Workers + Node both
// expose `crypto`, but the typings differ. Fall back to a manual UUID
// if needed.
function randomId(): string {
  const c: { randomUUID?: () => string } | undefined =
    typeof crypto !== "undefined" ? (crypto as unknown as { randomUUID?: () => string }) : undefined;
  if (c?.randomUUID) return c.randomUUID();
  // Fallback: 16 random bytes hex with v4 markers.
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

// Read-only resolver. Used by server components / server actions that
// need the IDs without mutating cookies. If the cookies aren't set,
// returns freshly generated IDs flagged as new — the caller can decide
// whether to persist them via `setSessionCookies()`.
export function readSession(cookies: ReadonlyRequestCookies): SessionPair {
  const existingVisitor = cookies.get(VISITOR_COOKIE)?.value;
  const existingSession = cookies.get(SESSION_COOKIE)?.value;
  const visitorId = existingVisitor ?? randomId();
  const sessionId = existingSession ?? randomId();
  return {
    visitorId,
    sessionId,
    isNewVisitor: !existingVisitor,
  };
}

// Persist the cookies. Server actions call this; the cookieStore
// must be the writable variant from `cookies()` (not from headers
// of a Server Component, which is read-only).
export interface WritableCookieStore {
  set(name: string, value: string, options: CookieOptions): void;
}

interface CookieOptions {
  path?: string;
  maxAge?: number;
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
}

export function setSessionCookies(
  store: WritableCookieStore,
  pair: SessionPair,
): void {
  // mlk_v lives 1 year. The cookie spec uses seconds for maxAge.
  store.set(VISITOR_COOKIE, pair.visitorId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "lax",
    secure: true,
  });
  // mlk_s is a 30-minute sliding window — re-set on every visit.
  store.set(SESSION_COOKIE, pair.sessionId, {
    path: "/",
    maxAge: 60 * 30,
    httpOnly: false,
    sameSite: "lax",
    secure: true,
  });
}
