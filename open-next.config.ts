import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

// Note on the "Dummy queue is not implemented" lines that show up
// in worker logs whenever ISR tries to background-revalidate a stale
// page: this is a known OpenNext-on-Cloudflare quirk. The default
// stub queue throws, the request itself still succeeds (the user sees
// the cached page; the revalidation just doesn't happen out-of-band),
// so the errors are noisy but non-blocking.
//
// The "proper" fix is to add a doQueue + Durable Object binding,
// but the DO migration can't land via `wrangler versions upload`
// (the deploy command Cloudflare CI uses) — it requires a one-time
// non-versioned `wrangler deploy`. Until we wire that, we accept
// the log noise.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
