import { createClient } from "@/lib/supabase/server";
import { FLEET as STATIC_FLEET, type Vehicle } from "@/data/vehicles";

function rowToVehicle(r: {
  slug: string;
  name: string;
  origin: "cn" | "ae";
  type: "ev" | "reev" | "phev" | "hybrid";
  year: number;
  price_egp: number;
  transmission: string | null;
  drivetrain: string | null;
  image_url: string | null;
}): Vehicle {
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
  };
}

export async function getAllVehicles(): Promise<Vehicle[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vehicles")
      .select(
        "slug, name, origin, type, year, price_egp, transmission, drivetrain, image_url",
      )
      .eq("is_published", true)
      .order("price_egp", { ascending: false });

    if (error || !data || data.length === 0) {
      return STATIC_FLEET;
    }
    return data.map(rowToVehicle);
  } catch {
    return STATIC_FLEET;
  }
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("vehicles")
      .select(
        "slug, name, origin, type, year, price_egp, transmission, drivetrain, image_url",
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) {
      return STATIC_FLEET.find((v) => v.id === slug) ?? null;
    }
    return rowToVehicle(data);
  } catch {
    return STATIC_FLEET.find((v) => v.id === slug) ?? null;
  }
}
