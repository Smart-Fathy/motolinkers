"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

type Origin = (typeof ORIGINS)[number];
type PowerTrain = (typeof TYPES)[number];
type Body = (typeof BODIES)[number];

type Field =
  | "name"
  | "brand"
  | "trim"
  | "origin"
  | "type"
  | "body"
  | "price_egp"
  | "is_published";

const VALID_FIELDS: ReadonlySet<Field> = new Set([
  "name",
  "brand",
  "trim",
  "origin",
  "type",
  "body",
  "price_egp",
  "is_published",
]);

type UpdatePayload =
  | { name: string }
  | { brand: string | null }
  | { trim: string | null }
  | { origin: Origin }
  | { type: PowerTrain }
  | { body: Body | null }
  | { price_egp: number }
  | { is_published: boolean };

function validate(
  field: Field,
  value: unknown,
): UpdatePayload | { error: string } {
  switch (field) {
    case "name": {
      const s = typeof value === "string" ? value.trim() : "";
      if (!s) return { error: "Name can't be empty." };
      return { name: s };
    }
    case "brand": {
      const s = typeof value === "string" ? value.trim() : "";
      return { brand: s ? s : null };
    }
    case "trim": {
      const s = typeof value === "string" ? value.trim() : "";
      return { trim: s ? s : null };
    }
    case "origin": {
      if (!ORIGINS.includes(value as Origin)) {
        return { error: "Origin must be cn or ae." };
      }
      return { origin: value as Origin };
    }
    case "type": {
      if (!TYPES.includes(value as PowerTrain)) {
        return { error: "Power train must be ev, reev, phev, or hybrid." };
      }
      return { type: value as PowerTrain };
    }
    case "body": {
      if (value === "" || value === null || value === undefined) {
        return { body: null };
      }
      if (!BODIES.includes(value as Body)) {
        return { error: `Body must be one of ${BODIES.join(", ")}.` };
      }
      return { body: value as Body };
    }
    case "price_egp": {
      const n =
        typeof value === "number"
          ? value
          : typeof value === "string"
            ? Number(value)
            : NaN;
      if (!Number.isFinite(n) || n < 0) {
        return { error: "Price must be a non-negative number." };
      }
      return { price_egp: Math.round(n) };
    }
    case "is_published": {
      if (typeof value !== "boolean") return { error: "Expected boolean." };
      return { is_published: value };
    }
  }
}

export async function quickUpdateVehicle(
  id: string,
  field: string,
  value: unknown,
): Promise<{ ok: true } | { error: string }> {
  if (!VALID_FIELDS.has(field as Field)) {
    return { error: `Field "${field}" is not editable inline.` };
  }
  const parsed = validate(field as Field, value);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  // Read the slug so we can revalidate the affected public page.
  const { data: row } = await supabase
    .from("vehicles")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("vehicles")
    .update(parsed)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/vehicles");
  if (row?.slug) revalidatePath(`/vehicles/${row.slug}`);
  revalidatePath("/admin/vehicles");

  return { ok: true };
}
