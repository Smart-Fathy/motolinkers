import { createPublicClient } from "@/lib/supabase/public";

export interface NewsItem {
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string | null;
  cover_image_url: string | null;
  published_at: string | null;
}

export async function getAllNews(): Promise<NewsItem[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("news")
      .select("slug, title, excerpt, body_md, cover_image_url, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false });
    if (error) {
      console.error("[news] getAllNews supabase error:", error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error("[news] getAllNews threw:", e);
    return [];
  }
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("news")
      .select("slug, title, excerpt, body_md, cover_image_url, published_at")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) {
      console.error(`[news] getNewsBySlug(${slug}) supabase error:`, error);
      return null;
    }
    return data ?? null;
  } catch (e) {
    console.error(`[news] getNewsBySlug(${slug}) threw:`, e);
    return null;
  }
}
