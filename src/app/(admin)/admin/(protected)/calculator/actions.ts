"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const NUMERIC_FIELDS = [
  "egp_rate",
  "freight_cn",
  "freight_ae",
  "transit_cn",
  "transit_ae",
  "tax_ev",
  "tax_reev",
  "tax_phev",
  "vat",
  "insurance_rate",
  "clearance_usd",
  "inland_delivery_usd",
  "consulting_fee_pct",
  "payment_usd_fee",
  "payment_bank_fee",
] as const;

export async function updateCalculatorConfig(formData: FormData) {
  const update: Record<string, number> = {};
  for (const key of NUMERIC_FIELDS) {
    const raw = formData.get(key);
    if (raw === null || raw === "") {
      return { error: `Missing value for ${key}.` };
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      return { error: `${key} must be a non-negative number.` };
    }
    update[key] = n;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("calculator_config")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/calculator");
  revalidatePath("/admin/calculator");
  return { ok: true };
}
