import { XMLParser } from "fast-xml-parser";
import type { CubeFace } from "./stitch-faces.js";

export interface LevelConfig {
  /** 1-indexed level number. Matches the %l placeholder. */
  level: number;
  /** Tiles per face row/col at this level. */
  gridSize: number;
  /** Pixel size of a single tile (usually 512). */
  tilePx: number;
  /** Build the absolute URL for a given face/tile coord at this level. */
  tileUrl(face: CubeFace, x: number, y: number): string;
}

export interface AutohomeConfig {
  /** All levels discovered from the XML, ordered low → high resolution. */
  levels: LevelConfig[];
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

/**
 * Find an <image> node anywhere in the parsed XML tree. krpano configs
 * place it at the top level for single-pano files but inside <scene>
 * blocks for multi-scene tours; autohome appears to use the latter for
 * interior+exterior bundles. Depth-first walk, return the first match
 * that has a <cube> child or url-bearing attribute.
 */
function findImageNode(node: unknown): Record<string, unknown> | undefined {
  if (!node || typeof node !== "object") return undefined;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findImageNode(item);
      if (found) return found;
    }
    return undefined;
  }
  const obj = node as Record<string, unknown>;
  const img = obj.image;
  if (img) {
    const imgs = Array.isArray(img) ? img : [img];
    for (const candidate of imgs) {
      if (candidate && typeof candidate === "object") {
        const c = candidate as Record<string, unknown>;
        if (c.cube || c.level || c.sphere || c.flat) {
          return c;
        }
      }
    }
  }
  for (const key of Object.keys(obj)) {
    if (key.startsWith("@_")) continue;
    const found = findImageNode(obj[key]);
    if (found) return found;
  }
  return undefined;
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
  const image = findImageNode(root);
  if (!image) {
    const snippet = xmlText.slice(0, 600).replace(/\s+/g, " ");
    throw new Error(
      `Pano config is malformed: no <image>+<cube> found. XML head: ${snippet}`,
    );
  }

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

  // Sort ascending: levels[0] is the smallest preview, levels[N-1] is the
  // highest resolution. krpano numbers levels starting at 1.
  levels.sort((a, b) => a.tiledImageWidth - b.tiledImageWidth);

  // Resolve %$varname% style variable references against the parsed
  // XML (krpano stores tileserver / scenepath / etc. as top-level
  // attributes or <data> entries that the URL template references).
  const vars = collectVariables(parsed);
  const resolvedTemplate = resolveVars(urlTemplate, vars);
  const absTemplate = absUrl(resolvedTemplate, xmlUrl);

  const out: LevelConfig[] = levels.map((lvl, idx) => {
    const levelNumber = idx + 1;
    const gridSize = Math.max(1, Math.ceil(lvl.tiledImageWidth / lvl.tilePx));
    return {
      level: levelNumber,
      gridSize,
      tilePx: lvl.tilePx,
      tileUrl(face, x, y) {
        // krpano placeholders:
        //   %l / %0l  → level number
        //   %s        → cube side (f/b/l/r/u/d)
        //   %h / %0h or %x / %0x  → column index
        //   %v / %0v or %y / %0y  → row index
        return absTemplate
          .replace(/%0?l/g, String(levelNumber))
          .replace(/%s/g, face)
          .replace(/%0?[hx]/g, String(x))
          .replace(/%0?[vy]/g, String(y));
      },
    };
  });

  return { levels: out };
}

/**
 * Walk the parsed XML tree, collecting any string-valued attribute or
 * element that could be referenced from a krpano URL template as
 * `%$name%`. Top-level krpano attributes (tileserver, scenepath) and
 * <data name="x" content="y"/> entries are the most common forms.
 */
function collectVariables(node: unknown): Map<string, string> {
  const out = new Map<string, string>();
  walk(node, out);
  return out;
}

function walk(node: unknown, out: Map<string, string>): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, out);
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("@_") && typeof v === "string") {
      out.set(k.slice(2).toLowerCase(), v);
    }
  }
  const name = (obj["@_name"] as string | undefined)?.toLowerCase();
  const content = (obj["@_content"] as string | undefined) ?? (obj["@_value"] as string | undefined);
  if (name && typeof content === "string") {
    out.set(name, content);
  }
  for (const [k, v] of Object.entries(obj)) {
    if (!k.startsWith("@_")) walk(v, out);
  }
}

function resolveVars(template: string, vars: Map<string, string>): string {
  let result = template;
  for (let i = 0; i < 5; i++) {
    const replaced = result.replace(/%\$([a-zA-Z0-9_]+)%/g, (whole, name: string) => {
      const v = vars.get(name.toLowerCase());
      return v ?? whole;
    });
    if (replaced === result) break;
    result = replaced;
  }
  return result;
}
