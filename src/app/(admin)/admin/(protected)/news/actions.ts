"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

type NewsInput = {
  title: string;
  slug: string;
  excerpt: string | null;
  body_md: string;
  cover_image_url: string | null;
  published_at: string | null;
  is_published: boolean;
};

function readForm(formData: FormData): NewsInput | { error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  const body_md = String(formData.get("body_md") ?? "").trim();

  if (!title) return { error: "Title is required." };
  if (!slug) return { error: "Slug is required." };
  if (!body_md) return { error: "Body (Markdown) is required." };

  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const cover_image_url =
    String(formData.get("cover_image_url") ?? "").trim() || null;
  const published_at_raw = String(formData.get("published_at") ?? "").trim();
  const published_at = published_at_raw
    ? new Date(published_at_raw).toISOString()
    : null;
  const is_published = formData.get("is_published") === "on";

  return { title, slug, excerpt, body_md, cover_image_url, published_at, is_published };
}

function bustPublic(slug?: string) {
  revalidatePath("/");
  revalidatePath("/news");
  if (slug) revalidatePath(`/news/${slug}`);
}

export async function createNews(formData: FormData) {
  const parsed = readForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("news").insert(parsed);
  if (error) return { error: error.message };

  bustPublic(parsed.slug);
  redirect("/admin/news");
}

export async function updateNews(id: string, formData: FormData) {
  const parsed = readForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("news")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("news").update(parsed).eq("id", id);
  if (error) return { error: error.message };

  bustPublic(parsed.slug);
  if (current?.slug && current.slug !== parsed.slug) {
    revalidatePath(`/news/${current.slug}`);
  }
  redirect("/admin/news");
}

export async function deleteNews(id: string) {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("news")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) return { error: error.message };

  bustPublic(current?.slug);
  return { ok: true };
}
