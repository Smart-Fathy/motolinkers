"use server";

import { revalidatePath } from "next/cache";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@/lib/supabase/server";

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif)$/i;

function publicUrlFor(key: string): string {
  const base =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "https://images.motolinkers.com";
  return `${base.replace(/\/$/, "")}/${key}`;
}

async function listImageUrls(slug: string): Promise<string[]> {
  const { env } = await getCloudflareContext({ async: true });
  if (!env.IMAGES_BUCKET) {
    throw new Error("IMAGES_BUCKET binding missing in this environment.");
  }
  const result = await env.IMAGES_BUCKET.list({
    prefix: `${slug}/`,
    limit: 1000,
  });
  return result.objects
    .map((o) => o.key)
    .filter((key) => IMAGE_EXT.test(key))
    .sort()
    .map(publicUrlFor);
}

function bustPublic(slug: string, id: string) {
  revalidatePath("/");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${slug}`);
  revalidatePath("/admin/vehicles");
  revalidatePath(`/admin/vehicles/${id}/edit`);
}

export async function syncVehicleGallery(
  id: string,
): Promise<
  | { ok: true; count: number; gallery: string[]; imageUrlSet: string | null }
  | { error: string }
> {
  const supabase = await createClient();
  const { data: row, error: readErr } = await supabase
    .from("vehicles")
    .select("slug, image_url")
    .eq("id", id)
    .maybeSingle();

  if (readErr) return { error: readErr.message };
  if (!row) return { error: `Vehicle ${id} not found.` };

  let urls: string[];
  try {
    urls = await listImageUrls(row.slug);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }

  // Replace gallery; only auto-promote a cover if there isn't one yet.
  const imageUrlSet =
    !row.image_url && urls.length > 0 ? urls[0] : null;

  const update: { gallery: string[]; image_url?: string } = { gallery: urls };
  if (imageUrlSet) update.image_url = imageUrlSet;

  const { error: writeErr } = await supabase
    .from("vehicles")
    .update(update)
    .eq("id", id);

  if (writeErr) return { error: writeErr.message };

  bustPublic(row.slug, id);

  return {
    ok: true,
    count: urls.length,
    gallery: urls,
    imageUrlSet,
  };
}

export async function syncAllGalleries(): Promise<
  | {
      ok: true;
      vehiclesProcessed: number;
      totalImages: number;
      summary: { slug: string; count: number }[];
    }
  | { error: string }
> {
  const supabase = await createClient();
  const { data: rows, error: readErr } = await supabase
    .from("vehicles")
    .select("id, slug, image_url");

  if (readErr) return { error: readErr.message };
  if (!rows || rows.length === 0) {
    return { ok: true, vehiclesProcessed: 0, totalImages: 0, summary: [] };
  }

  let totalImages = 0;
  const summary: { slug: string; count: number }[] = [];

  for (const row of rows) {
    let urls: string[];
    try {
      urls = await listImageUrls(row.slug);
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }

    const update: { gallery: string[]; image_url?: string } = { gallery: urls };
    if (!row.image_url && urls.length > 0) {
      update.image_url = urls[0];
    }

    const { error: writeErr } = await supabase
      .from("vehicles")
      .update(update)
      .eq("id", row.id);
    if (writeErr) return { error: `${row.slug}: ${writeErr.message}` };

    totalImages += urls.length;
    summary.push({ slug: row.slug, count: urls.length });
    revalidatePath(`/vehicles/${row.slug}`);
    revalidatePath(`/admin/vehicles/${row.id}/edit`);
  }

  revalidatePath("/");
  revalidatePath("/vehicles");
  revalidatePath("/admin/vehicles");

  return {
    ok: true,
    vehiclesProcessed: rows.length,
    totalImages,
    summary,
  };
}
