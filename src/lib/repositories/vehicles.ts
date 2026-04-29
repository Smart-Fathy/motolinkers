import { createClient } from "@/lib/supabase/server";
import {
  FLEET as STATIC_FLEET,
  type Vehicle,
  type VehicleBody,
  type VehicleDriveType,
  type VehiclePowerTrain,
} from "@/data/vehicles";

type VehicleRow = {
  slug: string;
  name: string;
  brand: string | null;
  model: string | null;
  trim: string | null;
  origin: "cn" | "ae";
  type: VehiclePowerTrain;
  body: VehicleBody | null;
  drive_type: VehicleDriveType | null;
  year: number;
  price_egp: number;
  transmission: string | null;
  drivetrain: string | null;
  image_url: string | null;
  gallery: unknown;
  features: unknown;
  created_at: string;
};

const SELECT_PUBLIC =
  "slug, name, brand, model, trim, origin, type, body, drive_type, year, price_egp, transmission, drivetrain, image_url, gallery, features, created_at";

function asGallery(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function asFeatures(v: unknown): Record<string, string[]> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string[]> = {};
  for (const [k, items] of Object.entries(v as Record<string, unknown>)) {
    if (!Array.isArray(items)) continue;
    const list = items.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
    if (list.length > 0) out[k] = list;
  }
  return out;
}

function rowToVehicle(r: VehicleRow): Vehicle {
  return {
    id: r.slug,
    name: r.name,
    origin: r.origin,
    type: r.type === "ev" ? "ev" : "hybrid",
    year: r.year,
    price: r.price_egp,
    trans: r.transmission ?? "",
    drive: r.drivetrain ?? "",
    img: r.image_url ?? "",
    brand: r.brand,
    model: r.model,
    trim: r.trim,
    body: r.body,
    driveType: r.drive_type,
    powerTrain: r.type,
    gallery: asGallery(r.gallery),
    features: asFeatures(r.features),
    createdAt: r.created_at,
  };
}

export async function getAllVehicles(): Promise<Vehicle[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vehicles")
      .select(SELECT_PUBLIC)
      .eq("is_published", true)
      .order("price_egp", { ascending: false });

    if (error || !data || data.length === 0) {
      return STATIC_FLEET;
    }
    return data.map((r) => rowToVehicle(r as unknown as VehicleRow));
  } catch {
    return STATIC_FLEET;
  }
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vehicles")
      .select(SELECT_PUBLIC)
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) {
      return STATIC_FLEET.find((v) => v.id === slug) ?? null;
    }
    return rowToVehicle(data as unknown as VehicleRow);
  } catch {
    return STATIC_FLEET.find((v) => v.id === slug) ?? null;
  }
}
