/**
 * Best-effort scraper for autohome.com.cn vehicle spec pages.
 *
 * Autohome's spec page (e.g. https://www.autohome.com.cn/spec/71023/) is
 * a server-rendered HTML page with the configuration data embedded
 * either as inline JSON or as a structured spec table. The exact shape
 * has changed multiple times over the years, so this scraper tries
 * several extraction strategies and returns whatever it can find.
 *
 * Returns a structured payload that the admin reviews in a per-field
 * diff before any of it lands on a vehicle row. The scraper is
 * intentionally conservative — it would rather return `undefined` for
 * a field than make a wrong guess.
 */

export interface SpecScrapeResult {
  source_url: string;
  /** Series + spec/trim combined, e.g. "Avatr 06 2025款 Ultra纯电版". */
  name?: string;
  /** Brand / manufacturer, e.g. "Avatr" / "阿维塔". */
  brand?: string;
  /** Series model, e.g. "06". */
  model?: string;
  /** Trim/variant, e.g. "Ultra纯电版" / "Ultra Pure EV". */
  trim?: string;
  /** Model year, e.g. 2025. */
  year?: number;
  /** Body type as autohome reports it (sedan, suv, etc.). */
  body?: string;
  /** Pure EV range in km. */
  range_km?: number;
  /** Combined motor power in PS (Pferdestärke / metric horsepower). */
  motor_power_ps?: number;
  /** Combined motor power in kW. */
  motor_power_kw?: number;
  /** Battery pack usable capacity in kWh. */
  battery_kwh?: number;
  /** Top speed in km/h. */
  top_speed_kmh?: number;
  /** 0–100 km/h acceleration in seconds. */
  acceleration_0_100?: number;
  /** Drivetrain in autohome's terms (FWD/RWD/AWD/4WD). */
  drivetrain?: string;
  /** Transmission description (often "电动车单速变速箱"). */
  transmission?: string;
  /** Seat count. */
  seats?: number;
  /** Factory MSRP in CNY (¥). */
  price_cny?: number;
  /** Feature list grouped by section, e.g. { "Driver assistance": ["AEB", "ACC", ...] }. */
  features?: Record<string, string[]>;
  /** All raw spec key/value pairs the scraper could find. The admin can review these in the diff. */
  raw_specs?: Record<string, string>;
  /** Page title verbatim, kept so the admin can sanity-check the right page was scraped. */
  page_title?: string;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export async function scrapeAutohomeSpec(url: string): Promise<SpecScrapeResult> {
  if (!/^https?:\/\/(www\.)?autohome\.com\.cn\//i.test(url)) {
    throw new Error("Not an autohome.com.cn spec URL.");
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Referer: "https://www.autohome.com.cn/",
        "Accept-Language": "en-US,en;q=0.9,zh;q=0.8",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Autohome page fetch failed: ${msg}.`);
  }
  if (!res.ok) throw new Error(`Autohome page returned HTTP ${res.status}.`);
  const html = await res.text();

  const result: SpecScrapeResult = { source_url: url };

  // ── Page title ──────────────────────────────────────────────────
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    result.page_title = decodeEntities(titleMatch[1]!.trim());
  }

  // ── Hydration JSON (modern autohome uses globalConfig / __NUXT__) ─
  const globalConfig = extractGlobalConfig(html);
  if (globalConfig) {
    const g = globalConfig as Record<string, unknown>;
    if (typeof g.name === "string") result.name = g.name;
    if (typeof g.specName === "string") result.trim = g.specName;
    if (typeof g.seriesName === "string") result.model = g.seriesName;
    if (typeof g.brandName === "string") result.brand = g.brandName;
    if (typeof g.year === "number") result.year = g.year;
    if (typeof g.minPrice === "number" && g.minPrice > 0) {
      result.price_cny = g.minPrice;
    }
  }

  // ── Spec key/value pairs from common HTML patterns ──────────────
  // Autohome variants over the years use a few patterns:
  //   <li class="cell-name">范围</li><li class="cell-value">625km</li>
  //   <th>百公里加速</th><td>3.9s</td>
  //   <span class="label">续航</span><span class="value">625</span>
  const specs = extractSpecPairs(html);
  if (Object.keys(specs).length > 0) {
    result.raw_specs = specs;
    applySpecsToResult(specs, result);
  }

  // ── Year + name inference from page title as a fallback ─────────
  if (!result.year && result.page_title) {
    const m = result.page_title.match(/(20\d{2})/);
    if (m) result.year = parseInt(m[1]!, 10);
  }
  if (!result.name && result.page_title) {
    // Trim autohome's site suffix ("- 汽车之家", "_汽车之家").
    result.name = result.page_title.replace(/[-_]\s*汽车之家.*$/, "").trim();
  }

  // ── Features — defer to a separate fetch if autohome serves a
  //    config table at a known sibling URL.
  const featureSection = extractFeatures(html);
  if (Object.keys(featureSection).length > 0) {
    result.features = featureSection;
  }

  return result;
}

/** Locate the inline `var globalConfig = {...}` or `window.__NUXT__` block. */
function extractGlobalConfig(html: string): unknown {
  // Pattern A: `var globalConfig = {...};`
  const a = html.match(/var\s+globalConfig\s*=\s*({[\s\S]*?})\s*;\s*</);
  if (a) {
    const parsed = safeJSONParse(a[1]!);
    if (parsed) return parsed;
  }
  // Pattern B: `window.__INITIAL_STATE__ = {...};`
  const b = html.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?})\s*;\s*</);
  if (b) {
    const parsed = safeJSONParse(b[1]!);
    if (parsed) return parsed;
  }
  // Pattern C: <script id="__NEXT_DATA__" type="application/json">{...}</script>
  const c = html.match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (c) {
    const parsed = safeJSONParse(c[1]!);
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      // Walk the typical nested shape to find spec data.
      return obj.props ?? obj.pageProps ?? obj;
    }
  }
  return null;
}

function safeJSONParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    // krpano configs and some autohome inline JS use single quotes or
    // unquoted keys — try a relaxed parse: convert single→double quotes
    // and quote bare keys. This is only attempted when strict parse
    // fails, so it's a last-ditch effort.
    try {
      const relaxed = s
        .replace(/([{,]\s*)([a-zA-Z_$][\w$]*)\s*:/g, '$1"$2":')
        .replace(/'([^']*?)'/g, '"$1"');
      return JSON.parse(relaxed);
    } catch {
      return null;
    }
  }
}

/** Pull every (label, value) pair out of common spec-table markup. */
function extractSpecPairs(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Pattern: <tr>…<th>label</th>…<td>value</td>…</tr>
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let m: RegExpExecArray | null;
  while ((m = trRe.exec(html))) {
    const row = m[1]!;
    const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
      .map((x) => stripTags(x[1]!))
      .filter(Boolean);
    if (cells.length >= 2 && cells[0]!.length < 30 && cells[1]!.length < 200) {
      out[cells[0]!] = cells[1]!;
    }
  }
  // Pattern: <li class="cell-name">label</li><li class="cell-value">value</li>
  const liRe =
    /class=["'][^"']*cell-name[^"']*["'][^>]*>([\s\S]*?)<\/li>[\s\S]*?class=["'][^"']*cell-value[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;
  while ((m = liRe.exec(html))) {
    const k = stripTags(m[1]!);
    const v = stripTags(m[2]!);
    if (k && v) out[k] = v;
  }
  return out;
}

function applySpecsToResult(
  specs: Record<string, string>,
  result: SpecScrapeResult,
): void {
  const getNum = (s: string): number | undefined => {
    const m = s.match(/-?\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : undefined;
  };

  for (const [k, v] of Object.entries(specs)) {
    // Match both the Chinese label and a common English fallback so
    // this works on translated or English-mirror autohome pages.
    if (/(纯电续航|续航里程|续航|range)/i.test(k) && !result.range_km) {
      result.range_km = getNum(v);
    }
    if (/(电动机总功率|总功率|总马力|马力|power)/i.test(k)) {
      if (/ps|匹/.test(v)) result.motor_power_ps ??= getNum(v);
      if (/kw/i.test(v)) result.motor_power_kw ??= getNum(v);
    }
    if (/(电池容量|battery|kwh)/i.test(k) && !result.battery_kwh) {
      result.battery_kwh = getNum(v);
    }
    if (/(最高速度|最高时速|top speed)/i.test(k) && !result.top_speed_kmh) {
      result.top_speed_kmh = getNum(v);
    }
    if (/(0-100|百公里加速|0\s*to\s*100)/i.test(k) && !result.acceleration_0_100) {
      result.acceleration_0_100 = getNum(v);
    }
    if (/(驱动|driv|wheel drive)/i.test(k) && !result.drivetrain) {
      result.drivetrain = mapDrivetrain(v);
    }
    if (/(变速箱|transmission|gearbox)/i.test(k) && !result.transmission) {
      result.transmission = v;
    }
    if (/(座位数|座椅|seat)/i.test(k) && !result.seats) {
      result.seats = getNum(v);
    }
    if (/(车身结构|body)/i.test(k) && !result.body) {
      result.body = mapBody(v);
    }
    if (/(厂商指导价|指导价|price|官方价)/i.test(k) && !result.price_cny) {
      // Strip ¥, ',', '万' (10000) etc.
      const raw = v.replace(/[,，]/g, "");
      const tenK = /万/.test(raw);
      const n = getNum(raw);
      if (n !== undefined) result.price_cny = tenK ? n * 10000 : n;
    }
  }
}

function mapDrivetrain(v: string): string {
  if (/前驱|前轮驱动|FWD/i.test(v)) return "fwd";
  if (/后驱|后轮驱动|RWD/i.test(v)) return "rwd";
  if (/四驱|四轮驱动|全时四驱|AWD/i.test(v)) return "awd";
  if (/4WD/i.test(v)) return "4wd";
  return v.trim();
}

function mapBody(v: string): string {
  if (/三厢|sedan/i.test(v)) return "sedan";
  if (/SUV/i.test(v)) return "suv";
  if (/两厢|hatchback/i.test(v)) return "hatchback";
  if (/MPV/i.test(v)) return "mpv";
  if (/旅行|wagon/i.test(v)) return "wagon";
  if (/皮卡|pickup/i.test(v)) return "pickup";
  if (/双门|coupe/i.test(v)) return "coupe";
  return v.trim().toLowerCase();
}

/**
 * Extract features grouped by section. Autohome's spec page often
 * encodes feature presence with class names (e.g. `td_data1` for "●"
 * standard, `td_data0` for "○" optional). We collect rows with a
 * checked indicator and bucket them under the nearest preceding
 * section heading.
 */
function extractFeatures(html: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  // Walk a simplified linearised view of the HTML, scanning for
  // section headers followed by feature rows that carry the
  // "configured" marker. We accept either:
  //   <h2>主动安全</h2>  …  <li>AEB自动刹车 <i class="dot dot-on"></i></li>
  //   <div class="config-section">驾驶辅助</div>  …  <li class="hasFeature">ACC自适应巡航</li>
  const sectionRe =
    /<(?:h[1-4]|div)[^>]*(?:class=["'][^"']*(?:config-?title|section-?title|cfg-title|tit)[^"']*["'])?[^>]*>([一-龥A-Za-z0-9 ·\-/]{2,30})<\/(?:h[1-4]|div)>/g;
  let cursor = 0;
  let currentSection = "Features";
  let s: RegExpExecArray | null;
  // Collect every section heading position to bucket subsequent <li>s.
  const headings: { idx: number; name: string }[] = [];
  while ((s = sectionRe.exec(html))) {
    headings.push({ idx: s.index, name: stripTags(s[1]!).trim() });
  }
  const liRe = /<li[^>]*>([\s\S]*?)<\/li>/g;
  let li: RegExpExecArray | null;
  while ((li = liRe.exec(html))) {
    const idx = li.index;
    while (cursor + 1 < headings.length && headings[cursor + 1]!.idx <= idx) {
      cursor++;
    }
    if (headings[cursor]) currentSection = headings[cursor]!.name;
    const raw = li[1]!;
    // Mark "configured" by finding the well-known classes/glyphs.
    const isStandard = /dot[-_ ]?on|hasFeature|td_data1|class=["'][^"']*on\b/.test(raw);
    if (!isStandard) continue;
    const label = stripTags(raw)
      .replace(/[●○✓✓●○]/g, "")
      .trim();
    if (!label || label.length > 60) continue;
    const bucket = out[currentSection] ?? [];
    if (!bucket.includes(label)) bucket.push(label);
    out[currentSection] = bucket;
  }
  // Drop any bucket that's just two-three throwaway labels — usually
  // false positives from nav/footer <li>s.
  for (const [k, v] of Object.entries(out)) {
    if (v.length < 2) delete out[k];
  }
  return out;
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
