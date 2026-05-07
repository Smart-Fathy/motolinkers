import { XMLParser } from "fast-xml-parser";
import type { CubeFace } from "./stitch-faces.js";

export interface AutohomeConfig {
  /** Highest cubemap level we'll download. */
  level: number;
  /** Tiles per face on the chosen level (e.g. 4 means a 4x4 grid). */
  gridSize: number;
  /** Pixel size of a single tile (typically 512). */
  tilePx: number;
  /** Build the absolute URL for a given face/level/tile coord. */
  tileUrl(face: CubeFace, x: number, y: number): string;
}

/**
 * Discover the krpano tile config for an autohome interior pano page.
 *
 * Strategy:
 *   1) Fetch the viewer HTML at `pageUrl`.
 *   2) Try to locate a krpano config XML referenced from the page
 *      (`<param name="xml" value="..."/>`, `data-xml="..."`,
 *       or a `data:` / inline `<krpano>` block).
 *   3) Fetch + parse the XML; extract:
 *        - the `<image type="cube" tilesize="..." multires="..."/>` config
 *          OR `<level>` blocks with `tiledimagewidth`,
 *        - the per-level URL template (`<cube url="…l%l/%s_%y_%x.jpg"/>`).
 *   4) Reduce to the highest level and return a `tileUrl()` resolver.
 *
 * If any step fails the function throws with a message that names the
 * failed step — the admin sees this verbatim in the form.
 */
export async function parseAutohome(pageUrl: string): Promise<AutohomeConfig> {
  if (!/^https?:\/\/pano\.autohome\.com\.cn\//i.test(pageUrl)) {
    throw new Error("Not an autohome pano URL.");
  }

  const html = await fetchText(pageUrl, "Autohome page");

  const xmlUrl = findXmlUrl(html, pageUrl);
  if (!xmlUrl) {
    throw new Error(
      "Could not locate krpano config in the page. Autohome may have changed their layout.",
    );
  }

  const xmlText = await fetchText(xmlUrl, "krpano XML");
  const cfg = parseKrpanoXml(xmlText, xmlUrl);
  return cfg;
}

async function fetchText(url: string, label: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
        Referer: "https://pano.autohome.com.cn/",
        "Accept-Language": "en-US,en;q=0.9,zh;q=0.8",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`${label} fetch failed: ${msg}.`);
  }
  if (!res.ok) throw new Error(`${label} returned HTTP ${res.status}.`);
  return await res.text();
}

function findXmlUrl(html: string, pageUrl: string): string | null {
  // Common krpano config-reference patterns:
  //   <param name="xml" value="…/index.xml" />
  //   data-xml="…/tour.xml"
  //   xml: "…/pano.xml"
  //   "vtour": "…/index.xml"
  const candidates: RegExp[] = [
    /<param\s+name=["']xml["']\s+value=["']([^"']+\.xml)["']/i,
    /\bdata-xml\s*=\s*["']([^"']+\.xml)["']/i,
    /\bxml\s*[:=]\s*["']([^"']+\.xml)["']/i,
    /\bxmlurl\s*[:=]\s*["']([^"']+\.xml)["']/i,
    /["']([^"']+\/(?:index|tour|pano|vtour)\.xml)["']/i,
  ];
  for (const re of candidates) {
    const m = html.match(re);
    if (m && m[1]) return absUrl(m[1], pageUrl);
  }
  return null;
}

function absUrl(maybeRel: string, base: string): string {
  try {
    return new URL(maybeRel, base).toString();
  } catch {
    return maybeRel;
  }
}

interface KrpanoLevel {
  tiledImageWidth: number;
  tilePx: number;
}

function parseKrpanoXml(xmlText: string, xmlUrl: string): AutohomeConfig {
  let parsed: unknown;
  try {
    parsed = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      allowBooleanAttributes: true,
    }).parse(xmlText);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Pano config is malformed XML: ${msg}.`);
  }

  const root = (parsed as Record<string, unknown>).krpano ?? parsed;
  const image = (root as Record<string, unknown>).image as Record<string, unknown> | undefined;
  if (!image) throw new Error("Pano config is malformed: no <image> element.");

  // Two krpano shapes are common:
  //   A) <image><cube url="…/l%l/%s_%y_%x.jpg" tilesize="512" multires="…"/></image>
  //   B) <image type="CUBE"><level tiledimagewidth="…"><cube url="…"/></level>...</image>
  let urlTemplate: string | undefined;
  let tilePx = 512;
  let levels: KrpanoLevel[] = [];

  if (image.cube) {
    const cube = image.cube as Record<string, unknown>;
    urlTemplate = (cube["@_url"] as string) ?? (cube.url as string) ?? undefined;
    const ts = (image["@_tilesize"] as string) ?? (cube["@_tilesize"] as string);
    if (ts) tilePx = parseInt(ts, 10) || 512;
    const multires = (image["@_multires"] as string) ?? (cube["@_multires"] as string);
    if (multires) {
      // multires="512,1024,2048,4096" — comma-sep tile and level widths
      const parts = multires
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));
      if (parts.length >= 2) {
        tilePx = parts[0]!;
        levels = parts.slice(1).map((tiledImageWidth) => ({ tiledImageWidth, tilePx }));
      }
    }
  }

  if (levels.length === 0) {
    const lvlNode = (image as Record<string, unknown>).level;
    const lvlArr = Array.isArray(lvlNode) ? lvlNode : lvlNode ? [lvlNode] : [];
    for (const l of lvlArr) {
      const obj = l as Record<string, unknown>;
      const w = parseInt((obj["@_tiledimagewidth"] as string) ?? "", 10);
      const cube = obj.cube as Record<string, unknown> | undefined;
      const ts = parseInt((obj["@_tilesize"] as string) ?? (cube?.["@_tilesize"] as string) ?? "", 10);
      if (!urlTemplate && cube) urlTemplate = (cube["@_url"] as string) ?? undefined;
      if (!Number.isNaN(w)) {
        levels.push({ tiledImageWidth: w, tilePx: !Number.isNaN(ts) ? ts : tilePx });
      }
    }
  }

  if (!urlTemplate) throw new Error("Pano config is malformed: no cube tile URL template.");
  if (levels.length === 0) throw new Error("Pano config is malformed: no resolution levels.");

  // Pick the highest-resolution level.
  levels.sort((a, b) => b.tiledImageWidth - a.tiledImageWidth);
  const top = levels[0]!;
  const level = levels.length;
  const gridSize = Math.max(1, Math.round(top.tiledImageWidth / top.tilePx));
  const finalTilePx = top.tilePx;
  const absTemplate = absUrl(urlTemplate, xmlUrl);

  return {
    level,
    gridSize,
    tilePx: finalTilePx,
    tileUrl(face, x, y) {
      // krpano placeholders: %l (level), %s (side: l/f/r/b/u/d), %x (col), %y (row).
      // Some configs use %0l/%0x/%0y for zero-padded numbers; handle both.
      return absTemplate
        .replace(/%0?l/g, String(level))
        .replace(/%s/g, face)
        .replace(/%0?x/g, String(x))
        .replace(/%0?y/g, String(y));
    },
  };
}
