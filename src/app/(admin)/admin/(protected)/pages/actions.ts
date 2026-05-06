"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidPageSlug, PAGE_REGISTRY } from "./PAGE_REGISTRY";
import type { PageSlug } from "@/lib/repositories/pages";
import type { Json } from "@/lib/supabase/database.types";
import { sanitiseInlineHtml } from "@/lib/cms-html";
import { sanitiseStyle, type SectionStyle } from "@/lib/cms-style";

// All admin actions return this discriminated union so callers can use
// `if (!result.ok) setError(result.error)` and TS narrows reliably.
// (The earlier `{ error } | { ok: true }` shape lost narrowing under
// Next.js's stricter typecheck — `result.error` came through as
// `string | undefined`, which `setError(string | null)` rejects.)
export type ActionResult = { ok: true } | { ok: false; error: string };

// ─── helpers ─────────────────────────────────────────────────────────

function publicPathForSlug(slug: PageSlug): string {
  return PAGE_REGISTRY.find((p) => p.slug === slug)?.publicPath ?? "/";
}

function bustPublic(slug: PageSlug) {
  revalidatePath(publicPathForSlug(slug));
  // Some pages share content via shells (e.g. home). Revalidate root
  // too to be safe.
  if (slug !== "home") revalidatePath("/");
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// ─── page_heroes ─────────────────────────────────────────────────────

export async function updatePageHero(formData: FormData): Promise<ActionResult> {
  const slug = String(formData.get("page_slug") ?? "").trim();
  if (!isValidPageSlug(slug)) return { ok: false, error:"Unknown page slug." };

  const image_url = String(formData.get("image_url") ?? "").trim() || null;
  const alt = String(formData.get("alt") ?? "").trim() || null;
  const height_vh = clampInt(formData.get("height_vh"), 20, 100, 60);
  const border_radius_px = clampInt(formData.get("border_radius_px"), 0, 64, 0);
  const opacity = Number(
    clampNum(formData.get("opacity"), 0.05, 1.0, 1.0).toFixed(2),
  );
  const overlay_color = String(formData.get("overlay_color") ?? "#0a0a0a").trim();
  const overlay_opacity = Number(
    clampNum(formData.get("overlay_opacity"), 0, 1, 0.35).toFixed(2),
  );
  const is_enabled = formData.get("is_enabled") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("page_heroes")
    .upsert(
      {
        page_slug: slug,
        image_url,
        alt,
        height_vh,
        border_radius_px,
        opacity,
        overlay_color,
        overlay_opacity,
        is_enabled,
      },
      { onConflict: "page_slug" },
    );
  if (error) return { ok: false, error:error.message };

  bustPublic(slug);
  return { ok: true };
}

// ─── page_sections ───────────────────────────────────────────────────

const SECTION_TYPES = [
  "paragraph",
  "image",
  "page_header",
  "hero_block",
  "marquee",
  "manifesto",
  "fleet_grid",
  "calculator_widget",
  "routes",
  "process",
  "testimonials",
  "stats_grid",
  "cta_block",
  "qa",
  "legal_clause",
] as const;
type EditableSectionType = (typeof SECTION_TYPES)[number];

function isEditableType(v: unknown): v is EditableSectionType {
  return typeof v === "string" && (SECTION_TYPES as readonly string[]).includes(v);
}

// ─── form-array helpers ──────────────────────────────────────────────
//
// The repeater submits arrays as `prefix.count` plus indexed entries
// like `prefix.0.title`, `prefix.1.title`, … `harvestArray` reads the
// count and pulls each item into the shape returned by `readItem`.

function harvestArray<T>(
  formData: FormData,
  prefix: string,
  readItem: (formData: FormData, prefix: string) => T | null,
): T[] {
  const count = Number(formData.get(`${prefix}.count`) ?? 0);
  if (!Number.isFinite(count) || count <= 0) return [];
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, 100); i++) {
    const item = readItem(formData, `${prefix}.${i}`);
    if (item !== null) out.push(item);
  }
  return out;
}

function fdString(formData: FormData, key: string, fallback = ""): string {
  const v = formData.get(key);
  return typeof v === "string" ? v : fallback;
}

// Pull the optional Typography block submitted by StyleFields. Returns
// undefined when nothing is set so we don't bloat the JSON.
function readSectionStyle(formData: FormData): SectionStyle | undefined {
  return sanitiseStyle({
    font_size: fdString(formData, "style.font_size"),
    font_weight: fdString(formData, "style.font_weight"),
    font_style: fdString(formData, "style.font_style"),
    color: fdString(formData, "style.color"),
    align: fdString(formData, "style.align"),
  });
}

// Merge a typed payload with an optional style block. Centralising the
// merge keeps every case in readSectionData uniform.
function withStyle(
  payload: { [key: string]: Json },
  formData: FormData,
): { [key: string]: Json } {
  const style = readSectionStyle(formData);
  if (!style) return payload;
  return { ...payload, style: style as unknown as Json };
}

function readCtaItem(
  formData: FormData,
  prefix: string,
): { label: string; href: string; variant: "primary" | "ghost" } | null {
  const label = fdString(formData, `${prefix}.label`).trim();
  const href = fdString(formData, `${prefix}.href`).trim();
  if (!label || !href) return null;
  const variant = formData.get(`${prefix}.variant`) === "ghost" ? "ghost" : "primary";
  return { label, href, variant };
}

// ─── readSectionData (per type) ─────────────────────────────────────

function readSectionData(
  type: EditableSectionType,
  formData: FormData,
): { [key: string]: Json } {
  switch (type) {
    case "paragraph":
      return withStyle(
        { text: fdString(formData, "text") },
        formData,
      );

    case "image":
      return withStyle(
        {
          url: fdString(formData, "url").trim(),
          alt: fdString(formData, "alt").trim(),
          width_pct: clampInt(formData.get("width_pct"), 20, 100, 100),
          border_radius_px: clampInt(formData.get("border_radius_px"), 0, 64, 12),
          opacity: Number(clampNum(formData.get("opacity"), 0.1, 1, 1).toFixed(2)),
          caption: fdString(formData, "caption").trim(),
        },
        formData,
      );

    case "page_header":
      return withStyle(
        {
          kicker: fdString(formData, "kicker").trim(),
          title_html: sanitiseInlineHtml(fdString(formData, "title_html").trim()),
        },
        formData,
      );

    case "hero_block": {
      const titleLines = harvestArray(formData, "title_lines", (fd, p) => {
        const text = sanitiseInlineHtml(fdString(fd, `${p}.text`).trim());
        return text ? text : null;
      });
      const ctas = harvestArray(formData, "ctas", readCtaItem);
      const ticker = harvestArray(formData, "ticker", (fd, p) => {
        const value = fdString(fd, `${p}.value`).trim();
        const label = fdString(fd, `${p}.label`).trim();
        if (!value && !label) return null;
        const value_suffix = fdString(fd, `${p}.value_suffix`).trim();
        const item: { value: string; label: string; value_suffix?: string } = {
          value,
          label,
        };
        if (value_suffix) item.value_suffix = value_suffix;
        return item;
      });
      return withStyle(
        {
          meta: {
            col1_top: fdString(formData, "meta.col1_top").trim(),
            col1_bot: fdString(formData, "meta.col1_bot").trim(),
            col2_top: fdString(formData, "meta.col2_top").trim(),
            col2_bot: fdString(formData, "meta.col2_bot").trim(),
          },
          title_lines: titleLines,
          aria_label: fdString(formData, "aria_label").trim(),
          lede_html: sanitiseInlineHtml(fdString(formData, "lede_html").trim()),
          ctas,
          ticker,
          scroll_label: fdString(formData, "scroll_label").trim() || "Scroll",
        },
        formData,
      );
    }

    case "marquee": {
      const items = harvestArray(formData, "items", (fd, p) => {
        const text = fdString(fd, `${p}.text`).trim();
        if (!text) return null;
        const italic = formData.get(`${p}.italic`) === "on";
        return italic ? { text, italic: true } : { text };
      });
      return withStyle({ items }, formData);
    }

    case "manifesto": {
      const body_paragraphs_html = harvestArray(formData, "body_paragraphs_html", (fd, p) => {
        const t = sanitiseInlineHtml(fdString(fd, `${p}.text`).trim());
        return t ? t : null;
      });
      const pillars = harvestArray(formData, "pillars", (fd, p) => {
        const number = fdString(fd, `${p}.number`).trim();
        const title = fdString(fd, `${p}.title`).trim();
        const body = fdString(fd, `${p}.body`).trim();
        if (!number && !title && !body) return null;
        return { number, title, body };
      });
      return withStyle(
        {
          kicker: fdString(formData, "kicker").trim(),
          title_html: sanitiseInlineHtml(fdString(formData, "title_html").trim()),
          body_paragraphs_html,
          pillars,
        },
        formData,
      );
    }

    case "fleet_grid":
      return withStyle(
        {
          kicker: fdString(formData, "kicker").trim(),
          title_html: sanitiseInlineHtml(fdString(formData, "title_html").trim()),
          subtitle: fdString(formData, "subtitle").trim(),
          mode: formData.get("mode") === "all" ? "all" : "featured",
        },
        formData,
      );

    case "calculator_widget":
      return withStyle(
        {
          kicker: fdString(formData, "kicker").trim(),
          title_html: sanitiseInlineHtml(fdString(formData, "title_html").trim()),
          subtitle: fdString(formData, "subtitle").trim(),
        },
        formData,
      );

    case "routes": {
      const routes = harvestArray(formData, "routes", (fd, p) => {
        const from = fdString(fd, `${p}.from`).trim();
        const to = fdString(fd, `${p}.to`).trim();
        if (!from && !to) return null;
        const flagFrom = fdString(fd, `${p}.flag_from`).toLowerCase() as
          | "cn"
          | "ae"
          | "eg";
        const flagTo = fdString(fd, `${p}.flag_to`).toLowerCase() as
          | "cn"
          | "ae"
          | "eg";
        return {
          flag_from: flagFrom === "ae" || flagFrom === "eg" ? flagFrom : "cn",
          flag_to: flagTo === "ae" || flagTo === "cn" ? flagTo : "eg",
          from,
          to,
          lane_label: fdString(fd, `${p}.lane_label`).trim(),
          freight_prefix: fdString(fd, `${p}.freight_prefix`).trim(),
          freight_value: fdString(fd, `${p}.freight_value`).trim(),
          transit_value: fdString(fd, `${p}.transit_value`).trim(),
          transit_suffix: fdString(fd, `${p}.transit_suffix`).trim(),
          carriers_value: fdString(fd, `${p}.carriers_value`).trim(),
          carriers_suffix: fdString(fd, `${p}.carriers_suffix`).trim(),
          svg_top_left: fdString(fd, `${p}.svg_top_left`).trim(),
          svg_top_right: fdString(fd, `${p}.svg_top_right`).trim(),
          svg_bottom: fdString(fd, `${p}.svg_bottom`).trim(),
          gradient_id: fdString(fd, `${p}.gradient_id`).trim() || `grad${Date.now()}`,
          gradient_from: fdString(fd, `${p}.gradient_from`).trim() || "#C9A84C",
          gradient_to: fdString(fd, `${p}.gradient_to`).trim() || "#C9A84C",
          // Path geometry kept on the server side; clients rarely edit
          // it. We default to a sensible curve if absent.
          svg_path:
            fdString(fd, `${p}.svg_path`).trim() ||
            "M30 80 Q 250 30, 570 80",
          svg_dot_from: {
            cx: clampInt(fd.get(`${p}.svg_dot_from.cx`), 0, 600, 30),
            cy: clampInt(fd.get(`${p}.svg_dot_from.cy`), 0, 160, 80),
          },
          svg_dot_to: {
            cx: clampInt(fd.get(`${p}.svg_dot_to.cx`), 0, 600, 570),
            cy: clampInt(fd.get(`${p}.svg_dot_to.cy`), 0, 160, 80),
          },
          svg_top_left_pos: {
            x: clampInt(fd.get(`${p}.svg_top_left_pos.x`), 0, 600, 30),
            y: clampInt(fd.get(`${p}.svg_top_left_pos.y`), 0, 200, 110),
          },
          svg_top_right_pos: {
            x: clampInt(fd.get(`${p}.svg_top_right_pos.x`), 0, 600, 570),
            y: clampInt(fd.get(`${p}.svg_top_right_pos.y`), 0, 200, 110),
          },
          svg_bottom_pos: {
            x: clampInt(fd.get(`${p}.svg_bottom_pos.x`), 0, 600, 300),
            y: clampInt(fd.get(`${p}.svg_bottom_pos.y`), 0, 200, 30),
          },
        };
      });
      return withStyle(
        {
          kicker: fdString(formData, "kicker").trim(),
          title_html: sanitiseInlineHtml(fdString(formData, "title_html").trim()),
          routes,
        },
        formData,
      );
    }

    case "process": {
      const steps = harvestArray(formData, "steps", (fd, p) => {
        const number = fdString(fd, `${p}.number`).trim();
        const title = fdString(fd, `${p}.title`).trim();
        const body = fdString(fd, `${p}.body`).trim();
        if (!number && !title && !body) return null;
        return { number, title, body };
      });
      return withStyle(
        {
          kicker: fdString(formData, "kicker").trim(),
          title_html: sanitiseInlineHtml(fdString(formData, "title_html").trim()),
          steps,
        },
        formData,
      );
    }

    case "testimonials": {
      const items = harvestArray(formData, "items", (fd, p) => {
        const initials = fdString(fd, `${p}.initials`).trim();
        const name = fdString(fd, `${p}.name`).trim();
        const role = fdString(fd, `${p}.role`).trim();
        const quote = fdString(fd, `${p}.quote`).trim();
        if (!initials && !name && !quote) return null;
        return { initials, name, role, quote };
      });
      return withStyle(
        {
          kicker: fdString(formData, "kicker").trim(),
          title_html: sanitiseInlineHtml(fdString(formData, "title_html").trim()),
          items,
        },
        formData,
      );
    }

    case "stats_grid": {
      const items = harvestArray(formData, "items", (fd, p) => {
        const target = clampInt(fd.get(`${p}.target`), 0, 1_000_000_000, 0);
        const suffix = fdString(fd, `${p}.suffix`).trim();
        const label = fdString(fd, `${p}.label`).trim();
        if (!label) return null;
        return { target, suffix, label };
      });
      return withStyle({ items }, formData);
    }

    case "cta_block": {
      const ctas = harvestArray(formData, "ctas", readCtaItem);
      const arabic_accent = fdString(formData, "arabic_accent").trim();
      const out: { [key: string]: Json } = {
        title_html: sanitiseInlineHtml(fdString(formData, "title_html").trim()),
        body_html: sanitiseInlineHtml(fdString(formData, "body_html").trim()),
        ctas,
      };
      if (arabic_accent) out.arabic_accent = arabic_accent;
      return withStyle(out, formData);
    }

    case "qa":
      return withStyle(
        {
          question: fdString(formData, "question").trim(),
          answer_html: sanitiseInlineHtml(fdString(formData, "answer_html").trim()),
        },
        formData,
      );

    case "legal_clause": {
      const list_items = harvestArray(formData, "list_items", (fd, p) => {
        const t = sanitiseInlineHtml(fdString(fd, `${p}.text`).trim());
        return t ? t : null;
      });
      const out: { [key: string]: Json } = {
        heading: fdString(formData, "heading").trim(),
        body_html: sanitiseInlineHtml(fdString(formData, "body_html").trim()),
      };
      if (list_items.length > 0) out.list_items = list_items;
      return withStyle(out, formData);
    }
  }
}

async function nextPosition(slug: PageSlug): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("page_sections")
    .select("position")
    .eq("page_slug", slug)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[pages] nextPosition error:", error);
    return 0;
  }
  return data ? data.position + 1 : 0;
}

export async function createSection(formData: FormData): Promise<ActionResult> {
  const slug = String(formData.get("page_slug") ?? "").trim();
  if (!isValidPageSlug(slug)) return { ok: false, error:"Unknown page slug." };

  const type = formData.get("type");
  if (!isEditableType(type)) return { ok: false, error:"Unsupported section type." };

  const data = readSectionData(type, formData);
  const position = await nextPosition(slug);

  const supabase = await createClient();
  const { error } = await supabase.from("page_sections").insert({
    page_slug: slug,
    position,
    type,
    data,
    is_visible: true,
  });
  if (error) return { ok: false, error:error.message };

  bustPublic(slug);
  return { ok: true };
}

export async function updateSection(id: string, formData: FormData): Promise<ActionResult> {
  if (!id) return { ok: false, error:"Missing section id." };
  const slug = String(formData.get("page_slug") ?? "").trim();
  if (!isValidPageSlug(slug)) return { ok: false, error:"Unknown page slug." };
  const type = formData.get("type");
  if (!isEditableType(type)) return { ok: false, error:"Unsupported section type." };

  const data = readSectionData(type, formData);
  const is_visible = formData.get("is_visible") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("page_sections")
    .update({ data, is_visible })
    .eq("id", id);
  if (error) return { ok: false, error:error.message };

  bustPublic(slug);
  return { ok: true };
}

export async function deleteSection(id: string, slugRaw: string): Promise<ActionResult> {
  if (!id) return { ok: false, error:"Missing section id." };
  if (!isValidPageSlug(slugRaw)) return { ok: false, error:"Unknown page slug." };

  const supabase = await createClient();
  const { error } = await supabase.from("page_sections").delete().eq("id", id);
  if (error) return { ok: false, error:error.message };

  bustPublic(slugRaw);
  return { ok: true };
}

// Move a section up or down by swapping positions with its neighbour.
// Done in two updates rather than a single reorder transaction because
// (page_slug, position) has a unique index — the sentinel position
// avoids a transient duplicate.
export async function moveSection(
  id: string,
  slugRaw: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  if (!id) return { ok: false, error:"Missing section id." };
  if (!isValidPageSlug(slugRaw)) return { ok: false, error:"Unknown page slug." };

  const supabase = await createClient();

  const { data: current, error: currentErr } = await supabase
    .from("page_sections")
    .select("id, position")
    .eq("id", id)
    .maybeSingle();
  if (currentErr || !current) {
    return { ok: false, error:currentErr?.message ?? "Section not found." };
  }

  const targetCmp = direction === "up" ? "lt" : "gt";
  const targetOrder = direction === "up" ? false : true; // ascending? false => desc

  const { data: neighbour } = await supabase
    .from("page_sections")
    .select("id, position")
    .eq("page_slug", slugRaw)
    .filter("position", targetCmp, current.position)
    .order("position", { ascending: targetOrder })
    .limit(1)
    .maybeSingle();
  if (!neighbour) return { ok: true }; // already at the edge

  // Swap via a sentinel position that no real row uses.
  const SENTINEL = -1;
  await supabase.from("page_sections").update({ position: SENTINEL }).eq("id", current.id);
  await supabase
    .from("page_sections")
    .update({ position: current.position })
    .eq("id", neighbour.id);
  await supabase
    .from("page_sections")
    .update({ position: neighbour.position })
    .eq("id", current.id);

  bustPublic(slugRaw);
  return { ok: true };
}
