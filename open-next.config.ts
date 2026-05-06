import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

// Without an explicit queue override, OpenNext falls back to a stub
// "dummy" queue that throws `FatalError: Dummy queue is not implemented`
// the first time ISR tries to revalidate a stale page in the
// background — which fires every time we revalidatePath() in admin
// actions or a 5-min ISR window expires.
//
// `doQueue` runs revalidations through a Durable Object so they
// happen out-of-band of the request that triggered them. The DO
// binding is added in wrangler.jsonc.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
});
