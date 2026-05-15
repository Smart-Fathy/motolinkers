"use server";

import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@/lib/supabase/server";
import { googleSheetExportUrl, parseCsv } from "@/lib/csv";
import { categoriseFeature } from "@/lib/feature-categories";
import { slugify } from "@/lib/utils";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB CSV cap — enough for 1000s of rows

// Origin / type / body enums — duplicated from `actions.ts` so this
// module stays self-contained.
const BODIES = [
  "sedan",
  "suv",
  "hatchback",
  "coupe",
  "wagon",
  "pickup",
  "mpv",
  "convertible",
] as const;

type Origin = "cn" | "ae";
type PowerTrain = "ev" | "reev" | "phev" | "hybrid";
type Body = (typeof BODIES)[number];

// ─── Types shared with the client wizard ────────────────────────────────

export type SpecMappedTo =
  | "name"
  | "brand"
  | "model"
  | "trim"
  | "price_egp"
  | "year"
  | "range_km"
  | "transmission"
  | "drivetrain"
  | "body"
  | "origin"
  | "feature"
  | "specs"
  | "unmapped";

export type VariantColumn = {
  index: number;
  headerLabel: string;
  derivedTrim: string;
  derivedYear: number | null;
  suggestedSlug: string;
};

export type SpecRow = {
  rowIndex: number;
  label: string;
  values: string[];
  mappedTo: SpecMappedTo;
  // Only populated for `mappedTo === "feature"` — section the keyword
  // dictionary picked for this row label.
  section?: string;
};

export type PreviewResult =
  | {
      ok: true;
      headerRow: string[];
      variantColumns: VariantColumn[];
      specRows: SpecRow[];
    }
  | { error: string };

export type VariantDecision =
  | { kind: "skip" }
  | {
      kind: "create";
      slug: string;
      origin: Origin;
      type: PowerTrain;
      brand: string | null;
      trim: string | null;
    }
  | { kind: "update"; vehicleId: string; trim: string | null };

export type ApplyPayload = {
  variantColumns: VariantColumn[];
  specRows: SpecRow[];
  decisions: Record<number, VariantDecision>; // keyed by variantColumn.index
};

export type ApplyResult =
  | {
      ok: true;
      results: { columnIndex: number; slug: string; status: string }[];
    }
  | { error: string };

// ─── Spec-row → field mapping dictionary ────────────────────────────────

function mapLabel(label: string): SpecMappedTo {
  const l = label.toLowerCase().trim();
  if (!l) return "unmapped";

  // Strict label matches — anchored regexes so "Former motor brand"
  // doesn't get pulled into "brand" the way it did with a substring
  // check. Rows that don't match here fall through to "specs" and are
  // preserved in the `specs` jsonb column.

  // Name
  if (/^model name$/.test(l) || /^name$/.test(l)) return "name";

  // Brand — only when "brand" is the whole label or sits at the start
  // (not "motor brand", "former motor brand", etc.)
  if (/^(brand|make|vehicle brand)$/.test(l)) return "brand";

  // Trim / edition
  if (/^(trim|edition)\b/.test(l)) return "trim";

  // Price
  if (
    l === "price" ||
    l.includes("manufacturer's guide price") ||
    l.includes("price (yuan)") ||
    l.includes("price (egp)")
  ) {
    return "price_egp";
  }

  // Year
  if (
    /^year\b/.test(l) ||
    l.includes("time to market") ||
    /^year of (manufacture|production|release)/.test(l)
  ) {
    return "year";
  }

  // Range (km) — require an unambiguous cycle name + "range" with no
  // "%" (so battery capacity rows don't match), or an explicit
  // "cruising range" / "range (km)".
  const isCycleRange =
    /(wltc|cltc|nedc|epa)/.test(l) && /\brange\b/.test(l) && !l.includes("%");
  const isExplicitRange =
    /\bcruising range\b/.test(l) || /^range\s*\(km\)/.test(l);
  if (isCycleRange || isExplicitRange) return "range_km";

  // Transmission
  if (/^(gearbox|transmission)$/.test(l)) return "transmission";

  // Body — only the structural body type, not "body color" etc.
  if (/^body( structure| type)?$/.test(l)) return "body";

  // Drivetrain notes — match the standalone term, not motor brand /
  // model rows.
  if (/^(engine|motor|drivetrain|powertrain)( type)?$/.test(l)) {
    return "drivetrain";
  }

  // Origin
  if (/^origin$/.test(l) || /^country of origin$/.test(l)) return "origin";

  // Anything else with a label is a free-form spec — preserved in the
  // `specs` jsonb column.
  return "specs";
}

// Glyphs that mark a row as "binary feature row" (yes/no). `?` and
// `x` cover spreadsheets that use them for "unknown" / "not present".
// Plain "x" without a real letter context is rare enough that we
// accept it for both casings.
const FEATURE_GLYPHS = new Set([
  "●", "○",
  "-", "—",
  "✓", "✗",
  "?",
  "x", "X",
]);

const FEATURE_TRUTHY = new Set(["●", "✓"]);

function isFeatureRow(values: string[]): boolean {
  // A row is a feature row iff every non-empty cell is one of the marker
  // glyphs. Empty cells are tolerated (unspecified for that variant).
  let nonEmpty = 0;
  for (const v of values) {
    const t = v.trim();
    if (t === "") continue;
    nonEmpty++;
    if (!FEATURE_GLYPHS.has(t)) return false;
  }
  return nonEmpty > 0;
}

// ─── Header → derived trim / year ────────────────────────────────────────

function deriveFromHeader(header: string): {
  derivedTrim: string;
  derivedYear: number | null;
  suggestedSlug: string;
} {
  const trimmed = header.trim();
  const yearMatch = trimmed.match(/^(20\d{2}|19\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;
  let rest = year ? trimmed.slice(yearMatch![0].length).trim() : trimmed;
  // Strip common suffixes that don't add information to the trim.
  rest = rest
    .replace(/\b(version|edition|trim)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return {
    derivedTrim: rest,
    derivedYear: year,
    suggestedSlug: slugify(trimmed) || `vehicle-${Date.now()}`,
  };
}

// ─── previewImport ────────────────────────────────────────────────────────

async function fetchCsvFromUrl(rawUrl: string): Promise<string | { error: string }> {
  if (!/^https:\/\//.test(rawUrl)) {
    return { error: "Only https URLs are accepted." };
  }
  const sheetUrl = googleSheetExportUrl(rawUrl);
  const fetchUrl = sheetUrl ?? rawUrl;
  let response: Response;
  try {
    response = await fetch(fetchUrl, { redirect: "follow" });
  } catch (e) {
    return { error: `Fetch failed: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!response.ok) {
    return {
      error: `Fetch returned HTTP ${response.status}. If this is a Google Sheet, share it as "anyone with the link can view".`,
    };
  }
  const text = await response.text();
  if (text.length > MAX_BYTES) {
    return { error: `CSV is too large (max ${MAX_BYTES / 1024 / 1024} MB).` };
  }
  return text;
}

function buildPreview(rows: string[][]): PreviewResult {
  if (rows.length < 2) {
    return { error: "CSV needs at least one header row and one spec row." };
  }
  const headerRow = rows[0];
  if (headerRow.length < 2) {
    return {
      error:
        "CSV needs at least two columns — column A holds spec names, columns B onwards are the variants.",
    };
  }

  const variantColumns: VariantColumn[] = [];
  for (let c = 1; c < headerRow.length; c++) {
    const headerLabel = (headerRow[c] ?? "").trim();
    if (!headerLabel) continue;
    const derived = deriveFromHeader(headerLabel);
    variantColumns.push({
      index: c,
      headerLabel,
      derivedTrim: derived.derivedTrim,
      derivedYear: derived.derivedYear,
      suggestedSlug: derived.suggestedSlug,
    });
  }
  if (variantColumns.length === 0) {
    return { error: "No variant columns found in row 1." };
  }

  const specRows: SpecRow[] = [];
  for (let r = 1; r < rows.length; r++) {
    const label = (rows[r][0] ?? "").trim();
    if (!label) continue;
    const values = variantColumns.map((vc) => rows[r][vc.index] ?? "");
    if (isFeatureRow(values)) {
      specRows.push({
        rowIndex: r,
        label,
        values,
        mappedTo: "feature",
        section: categoriseFeature(label),
      });
    } else {
      specRows.push({
        rowIndex: r,
        label,
        values,
        mappedTo: mapLabel(label),
      });
    }
  }

  return { ok: true, headerRow, variantColumns, specRows };
}

export async function previewImport(
  formData: FormData,
): Promise<PreviewResult> {
  const source = String(formData.get("source") ?? "");

  let csvText: string;
  if (source === "url") {
    const url = String(formData.get("url") ?? "").trim();
    if (!url) return { error: "Paste a CSV or Google Sheets URL." };
    const result = await fetchCsvFromUrl(url);
    if (typeof result !== "string") return result;
    csvText = result;
  } else if (source === "file") {
    const file = formData.get("file");
    if (!(file instanceof File)) return { error: "No file received." };
    if (file.size > MAX_BYTES) {
      return { error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB).` };
    }
    csvText = await file.text();
  } else {
    return { error: "Pick a source (file or URL)." };
  }

  const rows = parseCsv(csvText);
  return buildPreview(rows);
}

// ─── applyImport ─────────────────────────────────────────────────────────

function parseNumber(s: string): number | null {
  // Strip currency symbols, thousands separators, units, and trailing
  // narrative ("670 km · Pure EV" → 670).
  const cleaned = s.replace(/[, ]/g, "").match(/-?\d+(\.\d+)?/);
  if (!cleaned) return null;
  const n = Number(cleaned[0]);
  return Number.isFinite(n) ? n : null;
}

function parseYear(s: string): number | null {
  const m = s.match(/(20\d{2}|19\d{2})/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function parseBody(s: string): Body | null {
  const lower = s.toLowerCase();
  for (const b of BODIES) {
    if (lower.includes(b)) return b;
  }
  // Common synonyms.
  if (lower.includes("saloon")) return "sedan";
  if (lower.includes("estate")) return "wagon";
  if (lower.includes("minivan") || lower.includes("van")) return "mpv";
  return null;
}

type RowPatch = {
  name?: string;
  brand?: string | null;
  model?: string | null;
  trim?: string | null;
  origin?: Origin;
  type?: PowerTrain;
  body?: Body | null;
  year?: number;
  price_egp?: number;
  range_km?: number | null;
  transmission?: string | null;
  drivetrain?: string | null;
  features?: Record<string, string[]>;
  specs?: Record<string, string>;
  is_published?: boolean;
};

// Build the `specs` jsonb object for one variant by walking every row
// that mapLabel marked as "specs" (free-form non-feature rows we don't
// have a dedicated column for — curb weight, dimensions, warranty, etc).
// Only rows with a non-empty cell value for *this* variant are included.
function buildSpecsForVariant(
  variant: VariantColumn,
  variantColumns: VariantColumn[],
  specRows: SpecRow[],
): Record<string, string> {
  const offset = variantColumns.findIndex((v) => v.index === variant.index);
  if (offset < 0) return {};
  const out: Record<string, string> = {};
  for (const row of specRows) {
    if (row.mappedTo !== "specs") continue;
    const value = (row.values[offset] ?? "").trim();
    if (!value) continue;
    out[row.label] = value;
  }
  return out;
}

// Build the features object for one variant by walking every feature row
// and including the row label under its assigned section when the cell is
// "●" (filled dot).
function buildFeaturesForVariant(
  variant: VariantColumn,
  variantColumns: VariantColumn[],
  specRows: SpecRow[],
): Record<string, string[]> {
  const offset = variantColumns.findIndex((v) => v.index === variant.index);
  if (offset < 0) return {};
  const out: Record<string, string[]> = {};
  for (const row of specRows) {
    if (row.mappedTo !== "feature") continue;
    const cell = (row.values[offset] ?? "").trim();
    // Only "truthy" markers add the feature for this variant — "?"
    // means unknown, "○" / "-" / "—" / "✗" / "x" mean not present.
    if (!FEATURE_TRUTHY.has(cell)) continue;
    const section = row.section ?? "Other";
    if (!out[section]) out[section] = [];
    out[section].push(row.label);
  }
  return out;
}

// Build the non-feature patch for a variant (similar to buildPatchForVariant
// above, but properly indexed against variantColumns).
function buildSpecPatchForVariant(
  variant: VariantColumn,
  variantColumns: VariantColumn[],
  specRows: SpecRow[],
): RowPatch {
  const offset = variantColumns.findIndex((v) => v.index === variant.index);
  if (offset < 0) return {};
  const patch: RowPatch = {};
  for (const row of specRows) {
    if (row.mappedTo === "feature" || row.mappedTo === "unmapped") continue;
    const value = (row.values[offset] ?? "").trim();
    if (!value) continue;
    switch (row.mappedTo) {
      case "name":
        patch.name = value;
        break;
      case "brand":
        patch.brand = value;
        break;
      case "model":
        patch.model = value;
        break;
      case "trim":
        patch.trim = value;
        break;
      case "price_egp": {
        const n = parseNumber(value);
        if (n !== null && n >= 0) patch.price_egp = Math.round(n);
        break;
      }
      case "year": {
        const y = parseYear(value);
        if (y !== null) patch.year = y;
        break;
      }
      case "range_km": {
        const n = parseNumber(value);
        if (n !== null && n >= 0) patch.range_km = Math.round(n);
        break;
      }
      case "transmission":
        patch.transmission = value;
        break;
      case "drivetrain":
        patch.drivetrain = value;
        break;
      case "body": {
        const b = parseBody(value);
        if (b) patch.body = b;
        break;
      }
      case "origin": {
        const o = value.toLowerCase();
        if (o === "cn" || o === "china") patch.origin = "cn";
        else if (o === "ae" || o === "uae" || o.includes("emirat"))
          patch.origin = "ae";
        break;
      }
    }
  }
  return patch;
}

export async function applyImport(payload: ApplyPayload): Promise<ApplyResult> {
  const { variantColumns, specRows, decisions } = payload;
  if (!Array.isArray(variantColumns) || !Array.isArray(specRows)) {
    return { error: "Malformed payload." };
  }

  const supabase = await createClient();
  const results: { columnIndex: number; slug: string; status: string }[] = [];

  for (const variant of variantColumns) {
    const decision = decisions[variant.index];
    if (!decision || decision.kind === "skip") continue;

    const specPatch = buildSpecPatchForVariant(variant, variantColumns, specRows);
    const features = buildFeaturesForVariant(variant, variantColumns, specRows);
    const specs = buildSpecsForVariant(variant, variantColumns, specRows);

    if (decision.kind === "create") {
      // Required fields the schema enforces — fall back from the patch,
      // then to defaults derived from the column header.
      const slug = slugify(decision.slug || variant.suggestedSlug);
      if (!slug) {
        results.push({ columnIndex: variant.index, slug: "", status: "skipped (no slug)" });
        continue;
      }
      const name =
        specPatch.name ?? (variant.headerLabel || decision.slug || slug);
      const year = specPatch.year ?? variant.derivedYear ?? new Date().getFullYear();
      const priceEgp = specPatch.price_egp ?? 0;
      const origin = specPatch.origin ?? decision.origin;
      const type = specPatch.type ?? decision.type;
      const trim = decision.trim ?? specPatch.trim ?? variant.derivedTrim ?? null;
      const brand = decision.brand ?? specPatch.brand ?? null;

      const { error } = await supabase.from("vehicles").insert({
        slug,
        name,
        brand,
        model: specPatch.model ?? null,
        trim,
        origin,
        type,
        body: specPatch.body ?? null,
        year,
        price_egp: priceEgp,
        price_usd: null,
        transmission: specPatch.transmission ?? null,
        drivetrain: specPatch.drivetrain ?? null,
        range_km: specPatch.range_km ?? null,
        image_url: null,
        features,
        specs,
        is_published: false, // import-as-draft; admin reviews before going live
      });

      results.push({
        columnIndex: variant.index,
        slug,
        status: error ? `error: ${error.message}` : "created (draft)",
      });
    } else if (decision.kind === "update") {
      const { data: existing } = await supabase
        .from("vehicles")
        .select("slug")
        .eq("id", decision.vehicleId)
        .maybeSingle();
      if (!existing) {
        results.push({ columnIndex: variant.index, slug: "", status: "skipped (not found)" });
        continue;
      }
      const updatePatch: RowPatch = { ...specPatch, features, specs };
      if (decision.trim !== null && decision.trim !== undefined) {
        updatePatch.trim = decision.trim;
      } else if (variant.derivedTrim) {
        updatePatch.trim = variant.derivedTrim;
      }
      const { error } = await supabase
        .from("vehicles")
        .update(updatePatch)
        .eq("id", decision.vehicleId);
      results.push({
        columnIndex: variant.index,
        slug: existing.slug,
        status: error ? `error: ${error.message}` : "updated",
      });
      if (!error) {
        revalidatePath(`/vehicles/${existing.slug}`);
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/vehicles");
  revalidatePath("/admin/vehicles");

  return { ok: true, results };
}

// ─── Autohome URL importer ──────────────────────────────────────────
//
// Admin pastes either a single autohome.com.cn spec page URL (e.g.
// https://www.autohome.com.cn/spec/71023/) or a comparison page URL
// (car.autohome.com.cn/duibi/chexing/#carids=A,B,C). The Railway
// pano-importer service does the actual HTML fetch + scrape (keeping
// the autohome dependency off Cloudflare Workers). The wizard then
// shows one card per scraped vehicle with a skip / create / update
// decision and per-field opt-in checkboxes — same model as the CSV
// importer's variant columns.

export type AutohomeScrape = {
  source_url: string;
  name?: string;
  brand?: string;
  model?: string;
  trim?: string;
  year?: number;
  body?: string;
  range_km?: number;
  motor_power_ps?: number;
  motor_power_kw?: number;
  battery_kwh?: number;
  top_speed_kmh?: number;
  acceleration_0_100?: number;
  drivetrain?: string;
  transmission?: string;
  seats?: number;
  price_cny?: number;
  features?: Record<string, string[]>;
  raw_specs?: Record<string, string>;
  page_title?: string;
};

export type PreviewAutohomeResult =
  | {
      ok: true;
      /** CSV-importer-shaped preview — the wizard feeds this straight into the existing mapping step. */
      headerRow: string[];
      variantColumns: VariantColumn[];
      specRows: SpecRow[];
      /** Raw scrapes, kept around so the admin can see source URLs in the wizard. */
      scrapes: AutohomeScrape[];
    }
  | { error: string };

async function importerEnv(): Promise<{ url: string; token: string } | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const e = env as unknown as {
      PANO_IMPORTER_URL?: string;
      PANO_IMPORTER_TOKEN?: string;
    };
    const url = e.PANO_IMPORTER_URL ?? process.env.PANO_IMPORTER_URL;
    const token = e.PANO_IMPORTER_TOKEN ?? process.env.PANO_IMPORTER_TOKEN;
    if (!url || !token) return null;
    return { url, token };
  } catch {
    return null;
  }
}

/**
 * Expand a pasted URL into a list of single-vehicle spec URLs.
 *   - /spec/<id>/ → [self]
 *   - /duibi/chexing/#carids=A,B,C → [spec/A, spec/B, spec/C]
 *   - anything else with a carids= param → [spec/<each id>]
 */
function expandSpecUrls(input: string): string[] {
  const carids = input.match(/carids=([^&#]+)/i);
  if (carids) {
    const ids = decodeURIComponent(carids[1]!)
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length > 0) {
      return ids.map((id) => `https://www.autohome.com.cn/spec/${id}/`);
    }
  }
  return [input];
}

/**
 * Strip autohome's SEO boilerplate from a scraped name. Autohome titles
 * are usually shaped like `【图】 阿维塔06 2025款 Pro纯电版报价_图片_阿维塔`.
 * The `_报价_图片_<brand>` / `_图片_<brand>` / `_<brand>` tail is the same
 * brand name they put at the front, so trimming it gives us a cleaner
 * `阿维塔06 2025款 Pro纯电版` to feed the translator.
 */
function stripAutohomeBoilerplate(s: string | undefined): string | undefined {
  if (!s) return s;
  let out = s;
  out = out.replace(/^【[^】]*】\s*/g, "");
  out = out.replace(/[-_\s]*汽车之家[^_]*$/g, "");
  out = out.replace(/[_\s]*报价[_\s]*图片[_\s]*[^_\s]*$/g, "");
  out = out.replace(/[_\s]*图片[_\s]*[^_\s]*$/g, "");
  out = out.replace(/[_\s]*报价[_\s]*$/g, "");
  return out.trim();
}

const HAS_CJK = /[一-龥]/;

/**
 * Translate Chinese strings to English using the free
 * translate.googleapis.com gtx client endpoint. No API key.
 *
 * Strategy: dedupe → batches of 40 joined by "\n" → split the reply on
 * "\n" to restore the 1:1 mapping. If the line count doesn't match
 * (the endpoint sometimes splits or merges segments), retry that batch
 * one string at a time. Treat the whole thing as best-effort — any
 * failure returns whatever was translated and the caller falls back to
 * the original Chinese for the rest.
 */
async function translateChinese(
  strings: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const unique = Array.from(new Set(strings.filter((s) => HAS_CJK.test(s))));
  if (unique.length === 0) return out;

  const fetchOne = async (q: string): Promise<string | null> => {
    const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=${encodeURIComponent(q)}`;
    try {
      const r = await fetch(u, { cache: "no-store" });
      if (!r.ok) return null;
      const j = (await r.json()) as unknown;
      if (!Array.isArray(j) || !Array.isArray(j[0])) return null;
      const segs = j[0] as Array<[string, string, ...unknown[]]>;
      return segs.map((s) => s[0]).join("");
    } catch {
      return null;
    }
  };

  for (let i = 0; i < unique.length; i += 40) {
    const batch = unique.slice(i, i + 40);
    const joined = batch.join("\n");
    const translated = await fetchOne(joined);
    if (translated) {
      const parts = translated.split("\n");
      if (parts.length === batch.length) {
        for (let j = 0; j < batch.length; j++) {
          const t = parts[j]!.trim();
          if (t) out.set(batch[j]!, t);
        }
        continue;
      }
    }
    for (const s of batch) {
      const t = await fetchOne(s);
      if (t) out.set(s, t.trim());
    }
  }

  return out;
}

/**
 * Walk a scrape, collect every Chinese string, translate them in one
 * pass, then rewrite the scrape with the English versions. Strings
 * already in English are passed through.
 */
async function translateScrapeViaGoogle(
  scrape: AutohomeScrape,
): Promise<AutohomeScrape> {
  const cleaned: AutohomeScrape = {
    ...scrape,
    name: stripAutohomeBoilerplate(scrape.name),
  };

  const collect: string[] = [];
  const fields: Array<keyof AutohomeScrape> = [
    "name",
    "brand",
    "model",
    "trim",
    "drivetrain",
    "transmission",
    "body",
  ];
  for (const f of fields) {
    const v = cleaned[f];
    if (typeof v === "string" && HAS_CJK.test(v)) collect.push(v);
  }
  if (cleaned.features) {
    for (const [section, items] of Object.entries(cleaned.features)) {
      if (HAS_CJK.test(section)) collect.push(section);
      for (const it of items) {
        if (HAS_CJK.test(it)) collect.push(it);
      }
    }
  }

  if (collect.length === 0) return cleaned;

  const dict = await translateChinese(collect);
  if (dict.size === 0) return cleaned;

  const tr = (v: string | undefined): string | undefined =>
    v && dict.has(v) ? dict.get(v)! : v;

  const merged: AutohomeScrape = {
    ...cleaned,
    name: tr(cleaned.name),
    brand: tr(cleaned.brand),
    model: tr(cleaned.model),
    trim: tr(cleaned.trim),
    drivetrain: tr(cleaned.drivetrain),
    transmission: tr(cleaned.transmission),
    body: tr(cleaned.body),
  };

  if (cleaned.features) {
    const outFeatures: Record<string, string[]> = {};
    for (const [section, items] of Object.entries(cleaned.features)) {
      const newSection = tr(section) ?? section;
      outFeatures[newSection] = items.map((it) => tr(it) ?? it);
    }
    merged.features = outFeatures;
  }

  return merged;
}

/**
 * Convert N scraped autohome vehicles into the same CSV-importer
 * preview shape — one variant column per scrape, one spec row per
 * unique label across all scrapes. The wizard then routes through the
 * existing mapping step, so the admin sees and maps every row instead
 * of being limited to a hand-picked subset.
 *
 * Typed fields (name, brand, range, etc.) get pre-set `mappedTo` so the
 * admin doesn't have to fix the dropdowns. Everything else from
 * `raw_specs` defaults to `mappedTo: "specs"`, which the CSV apply path
 * already preserves into the per-vehicle `specs` jsonb column. Feature
 * rows arrive pre-tagged with `mappedTo: "feature"` and the autohome
 * section name.
 */
function scrapesToPreview(scrapes: AutohomeScrape[]): {
  headerRow: string[];
  variantColumns: VariantColumn[];
  specRows: SpecRow[];
} {
  const variantColumns: VariantColumn[] = scrapes.map((scrape, i) => {
    const label = scrape.name ?? scrape.page_title ?? `Vehicle ${i + 1}`;
    return {
      index: i + 1, // 1-based to mirror CSV column indices
      headerLabel: label,
      derivedTrim: scrape.trim ?? "",
      derivedYear: scrape.year ?? null,
      suggestedSlug: scrape.name ? slugify(scrape.name) : "",
    };
  });

  // ── Typed spec rows ────────────────────────────────────────────
  // The CSV importer's mapLabel() looks at the *label string* to pick
  // a default mappedTo. We bypass it by setting mappedTo directly on
  // each typed row so the dropdowns are pre-filled correctly.
  const typed: {
    label: string;
    mappedTo: SpecMappedTo;
    pick: (s: AutohomeScrape) => string | number | undefined;
  }[] = [
    { label: "Name", mappedTo: "name", pick: (s) => s.name },
    { label: "Brand", mappedTo: "brand", pick: (s) => s.brand },
    { label: "Model", mappedTo: "model", pick: (s) => s.model },
    { label: "Trim", mappedTo: "trim", pick: (s) => s.trim },
    { label: "Year", mappedTo: "year", pick: (s) => s.year },
    { label: "Body", mappedTo: "body", pick: (s) => s.body },
    { label: "Range (km)", mappedTo: "range_km", pick: (s) => s.range_km },
    { label: "Transmission", mappedTo: "transmission", pick: (s) => s.transmission },
    { label: "Drivetrain", mappedTo: "drivetrain", pick: (s) => s.drivetrain },
    { label: "Price (yuan)", mappedTo: "price_egp", pick: (s) => s.price_cny },
  ];

  const specRows: SpecRow[] = [];
  let rowIndex = 1;

  for (const def of typed) {
    const values = scrapes.map((s) => {
      const v = def.pick(s);
      return v === undefined || v === null ? "" : String(v);
    });
    if (values.every((v) => v === "")) continue;
    specRows.push({
      rowIndex: rowIndex++,
      label: def.label,
      values,
      mappedTo: def.mappedTo,
    });
  }

  // ── Powertrain free-form rows (no typed CSV mapping exists) ────
  // These land in the `specs` jsonb column verbatim, but the admin
  // can re-map them to anything via the dropdown.
  const freeform: { label: string; pick: (s: AutohomeScrape) => string | number | undefined }[] = [
    { label: "Motor power (PS)", pick: (s) => s.motor_power_ps },
    { label: "Motor power (kW)", pick: (s) => s.motor_power_kw },
    { label: "Battery (kWh)", pick: (s) => s.battery_kwh },
    { label: "Top speed (km/h)", pick: (s) => s.top_speed_kmh },
    { label: "0–100 km/h (s)", pick: (s) => s.acceleration_0_100 },
    { label: "Seats", pick: (s) => s.seats },
  ];
  for (const def of freeform) {
    const values = scrapes.map((s) => {
      const v = def.pick(s);
      return v === undefined || v === null ? "" : String(v);
    });
    if (values.every((v) => v === "")) continue;
    specRows.push({
      rowIndex: rowIndex++,
      label: def.label,
      values,
      mappedTo: "specs",
    });
  }

  // ── Every other raw_specs key autohome surfaced ─────────────────
  // Union of keys across all scrapes — preserves chassis, safety,
  // dimensions, etc. that the typed extraction doesn't cover.
  const seenRawKeys = new Set<string>();
  for (const scrape of scrapes) {
    if (!scrape.raw_specs) continue;
    for (const key of Object.keys(scrape.raw_specs)) {
      if (seenRawKeys.has(key)) continue;
      seenRawKeys.add(key);
      const values = scrapes.map((s) => s.raw_specs?.[key] ?? "");
      if (values.every((v) => v === "")) continue;
      specRows.push({
        rowIndex: rowIndex++,
        label: key,
        values,
        mappedTo: "specs",
      });
    }
  }

  // ── Feature rows ───────────────────────────────────────────────
  // Union every feature item across all scrapes, bucketed by the
  // section autohome put it in. Values are "●" for variants that
  // have the feature, "" for the rest — same convention the CSV
  // importer's feature rows use.
  type FeatureKey = { section: string; item: string };
  const featureKeys: FeatureKey[] = [];
  const seenFeatures = new Set<string>();
  for (const scrape of scrapes) {
    if (!scrape.features) continue;
    for (const [section, items] of Object.entries(scrape.features)) {
      for (const item of items) {
        const k = `${section}|${item}`;
        if (seenFeatures.has(k)) continue;
        seenFeatures.add(k);
        featureKeys.push({ section, item });
      }
    }
  }
  for (const { section, item } of featureKeys) {
    const values = scrapes.map((s) =>
      s.features?.[section]?.includes(item) ? "●" : "",
    );
    specRows.push({
      rowIndex: rowIndex++,
      label: item,
      values,
      mappedTo: "feature",
      section,
    });
  }

  const headerRow = ["Spec", ...variantColumns.map((v) => v.headerLabel)];
  return { headerRow, variantColumns, specRows };
}

export async function previewAutohomeImport(
  url: string,
): Promise<PreviewAutohomeResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const trimmed = url.trim();
  if (!trimmed) return { error: "Paste an autohome.com.cn URL first." };
  if (!/^https?:\/\/([a-z0-9-]+\.)?autohome\.com\.cn\//i.test(trimmed)) {
    return {
      error:
        "URL must be on autohome.com.cn (single spec like https://www.autohome.com.cn/spec/71023/ or a comparison page).",
    };
  }

  const targets = expandSpecUrls(trimmed);
  if (targets.length === 0) {
    return { error: "Could not find any vehicle URLs in that link." };
  }

  const cfg = await importerEnv();
  if (!cfg) {
    return {
      error:
        "Importer not configured (missing PANO_IMPORTER_URL / PANO_IMPORTER_TOKEN).",
    };
  }

  // Scrape each target in parallel. The Railway service queues them
  // internally (concurrency 2), so this is mostly bound by autohome's
  // response time.
  const endpoint = `${cfg.url.replace(/\/$/, "")}/import-spec`;
  const results = await Promise.all(
    targets.map(async (t): Promise<AutohomeScrape | { error: string }> => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${cfg.token}`,
          },
          body: JSON.stringify({ url: t }),
          cache: "no-store",
        });
        const body = (await res.json().catch(() => null)) as
          | { spec?: AutohomeScrape; error?: string }
          | null;
        if (!res.ok || !body || !body.spec) {
          return {
            error: body?.error ?? `Importer returned HTTP ${res.status}.`,
          };
        }
        return body.spec;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { error: `Could not reach importer: ${msg}.` };
      }
    }),
  );

  const scraped = results.filter(
    (r): r is AutohomeScrape => !("error" in r),
  );
  if (scraped.length === 0) {
    const first = results.find((r) => "error" in r) as { error: string };
    return { error: first.error };
  }

  // Translate each scrape to English via the free Google Translate gtx
  // endpoint (no API key). Best-effort — anything the endpoint can't
  // translate stays in Chinese and the admin can edit after import.
  const specs = await Promise.all(
    scraped.map((s) => translateScrapeViaGoogle(s)),
  );

  const { headerRow, variantColumns, specRows } = scrapesToPreview(specs);
  return { ok: true, headerRow, variantColumns, specRows, scrapes: specs };
}

