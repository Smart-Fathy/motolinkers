"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { slugify } from "@/lib/utils";
import { isValidPageSlug } from "./PAGE_REGISTRY";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

function safeFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
  const base = dot >= 0 ? name.slice(0, dot) : name;
  const slugBase = slugify(base) || "image";
  return ext ? `${slugBase}.${ext}` : slugBase;
}

// Mirror of vehicles/upload-action.ts but writes under pages/<slug>/.
// Used by the page-hero editor and the per-section image editor.
export async function uploadPageImage(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const file = formData.get("file");
  const rawSlug = String(formData.get("page_slug") ?? "").trim();

  if (!isValidPageSlug(rawSlug)) {
    return { error: "Unknown page slug." };
  }
  if (!(file instanceof File)) return { error: "No file received." };
  if (!ALLOWED_TYPES.has(file.type)) {
    return { error: `Unsupported file type: ${file.type || "unknown"}.` };
  }
  if (file.size > MAX_BYTES) {
    return { error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB; max 10 MB).` };
  }

  const { env } = await getCloudflareContext({ async: true });
  if (!env.IMAGES_BUCKET) {
    return { error: "IMAGES_BUCKET binding missing in this environment." };
  }

  const filename = safeFilename(file.name);
  const key = `pages/${rawSlug}/${Date.now()}-${filename}`;

  await env.IMAGES_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const base =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "https://images.motolinkers.com";
  return { url: `${base.replace(/\/$/, "")}/${key}` };
}
