"use server";

import { revalidatePath } from "next/cache";
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
  if (/^model name|^model\b/.test(l)) return "name";
  if (l.includes("brand")) return "brand";
  if (l.includes("trim") || l.includes("edition")) return "trim";
  if (
    l.includes("manufacturer's guide price") ||
    l.includes("price (yuan)") ||
    l.includes("price (egp)") ||
    l === "price"
  ) {
    return "price_egp";
  }
  if (l.includes("year") || l.includes("time to market")) return "year";
  if (
    l.includes("wltc") ||
    l.includes("cltc") ||
    /\brange\b/.test(l) ||
    l.includes("cruising range")
  ) {
    return "range_km";
  }
  if (l.includes("gearbox") || l.includes("transmission")) return "transmission";
  if (l.includes("body structure") || /\bbody\b/.test(l)) return "body";
  if (
    l.includes("engine") ||
    l.includes("motor") ||
    l.includes("drivetrain") ||
    l.includes("powertrain")
  ) {
    return "drivetrain";
  }
  if (l === "origin" || l.includes("country of origin")) return "origin";
  return "unmapped";
}

function isFeatureRow(values: string[]): boolean {
  // A row is a feature row iff every non-empty cell is one of the marker
  // glyphs. Empty cells are tolerated (unspecified for that variant).
  let nonEmpty = 0;
  for (const v of values) {
    const t = v.trim();
    if (t === "") continue;
    nonEmpty++;
    if (t !== "●" && t !== "○" && t !== "-" && t !== "—") return false;
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
  is_published?: boolean;
};

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
    if (cell !== "●") continue; // only filled dot counts
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
      const updatePatch: RowPatch = { ...specPatch, features };
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
