"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidPageSlug, PAGE_REGISTRY } from "./PAGE_REGISTRY";
import type { PageSlug } from "@/lib/repositories/pages";
import type { Json } from "@/lib/supabase/database.types";

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

const SECTION_TYPES = ["paragraph", "image"] as const;
type EditableSectionType = (typeof SECTION_TYPES)[number];

function isEditableType(v: unknown): v is EditableSectionType {
  return typeof v === "string" && (SECTION_TYPES as readonly string[]).includes(v);
}

// Returns a Json-typed object so it's directly assignable to the
// page_sections.data jsonb column without a cast at the insert site.
function readSectionData(
  type: EditableSectionType,
  formData: FormData,
): { [key: string]: Json } {
  if (type === "paragraph") {
    return {
      text: String(formData.get("text") ?? ""),
      align: formData.get("align") === "center" ? "center" : "left",
    };
  }
  // image
  return {
    url: String(formData.get("url") ?? "").trim(),
    alt: String(formData.get("alt") ?? "").trim(),
    width_pct: clampInt(formData.get("width_pct"), 20, 100, 100),
    border_radius_px: clampInt(formData.get("border_radius_px"), 0, 64, 12),
    opacity: Number(clampNum(formData.get("opacity"), 0.1, 1, 1).toFixed(2)),
    caption: String(formData.get("caption") ?? "").trim(),
  };
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
