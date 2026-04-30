import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cookieless server-side client for fully public reads (news, vehicles,
// calculator config). Using the cookies-based SSR client on a route
// that declares `revalidate` causes Next.js to throw a "page changed
// from static to dynamic at runtime, reason: cookies" error when a
// slug not present in generateStaticParams is requested — the read
// path opts the page into dynamic rendering, conflicting with its
// declared static-with-revalidation contract.
//
// Don't use this client for anything user-scoped (admin reads/writes,
// auth-protected routes) — it has no session.
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
