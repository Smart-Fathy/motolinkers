"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

const ORIGINS = ["cn", "ae"] as const;
const TYPES = ["ev", "reev", "phev", "hybrid"] as const;
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
const DRIVE_TYPES = ["fwd", "rwd", "awd", "4wd"] as const;

type VehicleInput = {
  name: string;
  slug: string;
  brand: string | null;
  model: string | null;
  origin: (typeof ORIGINS)[number];
  type: (typeof TYPES)[number];
  body: (typeof BODIES)[number] | null;
  drive_type: (typeof DRIVE_TYPES)[number] | null;
  year: number;
  price_egp: number;
  price_usd: number | null;
  transmission: string | null;
  drivetrain: string | null;
  range_km: number | null;
  image_url: string | null;
  gallery: string[];
  is_featured: boolean;
  is_published: boolean;
};

function readForm(formData: FormData): VehicleInput | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugRaw ? slugify(slugRaw) : slugify(name);
  const origin = String(formData.get("origin") ?? "");
  const type = String(formData.get("type") ?? "");
  const bodyRaw = String(formData.get("body") ?? "");
  const driveTypeRaw = String(formData.get("drive_type") ?? "");
  const yearN = Number(formData.get("year"));
  const priceEgpN = Number(formData.get("price_egp"));

  if (!name) return { error: "Name is required." };
  if (!slug) return { error: "Slug is required." };
  if (!ORIGINS.includes(origin as (typeof ORIGINS)[number])) {
    return { error: "Origin must be cn or ae." };
  }
  if (!TYPES.includes(type as (typeof TYPES)[number])) {
    return { error: "Type must be ev, reev, phev, or hybrid." };
  }
  if (bodyRaw && !BODIES.includes(bodyRaw as (typeof BODIES)[number])) {
    return { error: `Body must be one of ${BODIES.join(", ")}.` };
  }
  if (
    driveTypeRaw &&
    !DRIVE_TYPES.includes(driveTypeRaw as (typeof DRIVE_TYPES)[number])
  ) {
    return { error: "Drive type must be fwd, rwd, awd, or 4wd." };
  }
  if (!Number.isFinite(yearN) || yearN < 1990 || yearN > 2100) {
    return { error: "Year must be a sensible number." };
  }
  if (!Number.isFinite(priceEgpN) || priceEgpN < 0) {
    return { error: "Price (EGP) must be a positive number." };
  }

  const optNum = (key: string): number | null => {
    const v = formData.get(key);
    if (v === null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const optStr = (key: string): string | null => {
    const v = String(formData.get(key) ?? "").trim();
    return v ? v : null;
  };

  // Gallery is sent as a JSON-encoded string array in a hidden input.
  let gallery: string[] = [];
  const galleryRaw = String(formData.get("gallery") ?? "[]");
  try {
    const parsed = JSON.parse(galleryRaw);
    if (Array.isArray(parsed)) {
      gallery = parsed
        .map((u) => (typeof u === "string" ? u.trim() : ""))
        .filter((u) => u.length > 0);
    }
  } catch {
    return { error: "Gallery payload was malformed." };
  }

  return {
    name,
    slug,
    brand: optStr("brand"),
    model: optStr("model"),
    origin: origin as (typeof ORIGINS)[number],
    type: type as (typeof TYPES)[number],
    body: bodyRaw ? (bodyRaw as (typeof BODIES)[number]) : null,
    drive_type: driveTypeRaw
      ? (driveTypeRaw as (typeof DRIVE_TYPES)[number])
      : null,
    year: yearN,
    price_egp: priceEgpN,
    price_usd: optNum("price_usd"),
    transmission: optStr("transmission"),
    drivetrain: optStr("drivetrain"),
    range_km: optNum("range_km"),
    image_url: optStr("image_url"),
    gallery,
    is_featured: formData.get("is_featured") === "on",
    is_published: formData.get("is_published") === "on",
  };
}

function bustPublic(slug?: string) {
  revalidatePath("/");
  revalidatePath("/vehicles");
  if (slug) revalidatePath(`/vehicles/${slug}`);
}

export async function createVehicle(formData: FormData) {
  const parsed = readForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { error } = await supabase.from("vehicles").insert(parsed);
  if (error) return { error: error.message };

  bustPublic(parsed.slug);
  redirect("/admin/vehicles");
}

export async function updateVehicle(id: string, formData: FormData) {
  const parsed = readForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("vehicles")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("vehicles")
    .update(parsed)
    .eq("id", id);
  if (error) return { error: error.message };

  bustPublic(parsed.slug);
  if (current?.slug && current.slug !== parsed.slug) {
    revalidatePath(`/vehicles/${current.slug}`);
  }
  redirect("/admin/vehicles");
}

export async function deleteVehicle(id: string) {
  const supabase = await createClient();
  const { data: current } = await supabase
    .from("vehicles")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) return { error: error.message };

  bustPublic(current?.slug);
  return { ok: true };
}
