"use server";

import { createClient } from "@/lib/supabase/server";

export interface LeadResult {
  ok: boolean;
  error?: string;
}

export async function submitLead(formData: FormData): Promise<LeadResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const vehicle_interest = String(formData.get("vehicle") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name) return { ok: false, error: "Name is required." };
  if (!email && !phone)
    return { ok: false, error: "Either email or phone is required." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("leads").insert({
      name,
      email: email || null,
      phone: phone || null,
      vehicle_interest: vehicle_interest || null,
      message: message || null,
      source: "website",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Submission failed." };
  }
}
