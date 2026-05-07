"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { slugify } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

// Strip the extension, slugify the base, then re-attach the original
// extension. "Front 3/4 angle.JPG" -> "front-3-4-angle.jpg"
function safeFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
  const base = dot >= 0 ? name.slice(0, dot) : name;
  const slugBase = slugify(base) || "image";
  return ext ? `${slugBase}.${ext}` : slugBase;
}

export async function uploadVehicleImage(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const file = formData.get("file");
  const slug = String(formData.get("slug") ?? "").trim();

  if (!slug) return { error: "Save the vehicle slug first, then upload." };
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

  const cleanSlug = slugify(slug) || slug;
  const filename = safeFilename(file.name);
  // Optional sub-folder (e.g. "spin", "pano") — locked down so callers
  // can't traverse out of the slug prefix.
  const folder = String(formData.get("folder") ?? "").trim();
  const folderPart = folder && /^[a-z0-9-]+$/.test(folder) ? `${folder}/` : "";
  const key = `${cleanSlug}/${folderPart}${Date.now()}-${filename}`;

  await env.IMAGES_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  const base =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "https://images.motolinkers.com";
  return { url: `${base.replace(/\/$/, "")}/${key}` };
}
