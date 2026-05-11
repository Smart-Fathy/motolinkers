import pLimit from "p-limit";

const TILE_CONCURRENCY = 8;
const TILE_TIMEOUT_MS = 15_000;
const TILE_RETRIES = 2;

export interface TileRequest {
  url: string;
  face: string;
  x: number;
  y: number;
}

export interface TileResult extends TileRequest {
  buffer: Buffer;
}

export async function downloadTiles(tiles: TileRequest[]): Promise<TileResult[]> {
  const limit = pLimit(TILE_CONCURRENCY);
  return Promise.all(tiles.map((t) => limit(() => fetchOne(t))));
}

async function fetchOne(t: TileRequest): Promise<TileResult> {
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= TILE_RETRIES; attempt++) {
    try {
      const buffer = await fetchWithTimeout(t.url);
      return { ...t, buffer };
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
      if (attempt < TILE_RETRIES) {
        await sleep(200 * (attempt + 1));
      }
    }
  }
  throw new Error(`Tile fetch failed: ${t.url} (${lastErr?.message ?? "unknown"}). Autohome may be rate-limiting.`);
}

async function fetchWithTimeout(url: string): Promise<Buffer> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TILE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        Referer: "https://pano.autohome.com.cn/",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } finally {
    clearTimeout(timer);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
