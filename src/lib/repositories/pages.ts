import { createPublicClient } from "@/lib/supabase/public";

// Page slugs that are valid keys for page_heroes / page_sections.
// Keep in sync with src/app/(admin)/admin/(protected)/pages/PAGE_REGISTRY.
export type PageSlug =
  | "home"
  | "about"
  | "how-it-works"
  | "vehicles"
  | "news"
  | "contact"
  | "calculator"
  | "faq"
  | "terms"
  | "privacy";

export interface PageHero {
  page_slug: string;
  image_url: string | null;
  alt: string | null;
  height_vh: number;
  border_radius_px: number;
  opacity: number;
  overlay_color: string;
  overlay_opacity: number;
  is_enabled: boolean;
}

export type SectionType =
  | "paragraph"
  | "image"
  | "heading"
  | "rich_text"
  | "gallery"
  | "list"
  | "cta"
  | "spacer"
  | "divider"
  | "embed"
  | "page_header"
  | "hero_block"
  | "marquee"
  | "manifesto"
  | "fleet_grid"
  | "calculator_widget"
  | "routes"
  | "process"
  | "testimonials"
  | "stats_grid"
  | "cta_block"
  | "qa"
  | "legal_clause";

export interface PageSection {
  id: string;
  page_slug: string;
  position: number;
  type: SectionType;
  data: unknown; // shape depends on `type`; renderers narrow at the call site
  is_visible: boolean;
}

const HERO_SELECT =
  "page_slug, image_url, alt, height_vh, border_radius_px, opacity, overlay_color, overlay_opacity, is_enabled";

const SECTION_SELECT =
  "id, page_slug, position, type, data, is_visible";

export async function getPageHero(slug: PageSlug): Promise<PageHero | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("page_heroes")
      .select(HERO_SELECT)
      .eq("page_slug", slug)
      .eq("is_enabled", true)
      .maybeSingle();

    if (error) {
      console.error(`[pages] getPageHero(${slug}) supabase error:`, error);
      return null;
    }
    if (!data || !data.image_url) return null;
    return {
      page_slug: data.page_slug,
      image_url: data.image_url,
      alt: data.alt,
      height_vh: Number(data.height_vh),
      border_radius_px: Number(data.border_radius_px),
      opacity: Number(data.opacity),
      overlay_color: data.overlay_color,
      overlay_opacity: Number(data.overlay_opacity),
      is_enabled: data.is_enabled,
    };
  } catch (e) {
    console.error(`[pages] getPageHero(${slug}) threw:`, e);
    return null;
  }
}

export async function getPageSections(slug: PageSlug): Promise<PageSection[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("page_sections")
      .select(SECTION_SELECT)
      .eq("page_slug", slug)
      .eq("is_visible", true)
      .order("position", { ascending: true });

    if (error) {
      console.error(`[pages] getPageSections(${slug}) supabase error:`, error);
      return [];
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      page_slug: r.page_slug,
      position: r.position,
      type: r.type as SectionType,
      data: r.data,
      is_visible: r.is_visible,
    }));
  } catch (e) {
    console.error(`[pages] getPageSections(${slug}) threw:`, e);
    return [];
  }
}
