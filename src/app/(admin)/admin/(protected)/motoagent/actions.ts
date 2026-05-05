"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { ok: true } | { ok: false; error: string };

function clampNum(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  return Math.round(clampNum(v, min, max, fallback));
}

export async function updateMotoagentSettings(
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const patch = {
    is_enabled: formData.get("is_enabled") === "on",
    model: String(formData.get("model") ?? "").trim() || "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    temperature: Number(clampNum(formData.get("temperature"), 0, 2, 0.6).toFixed(2)),
    max_output_tokens: clampInt(formData.get("max_output_tokens"), 64, 4096, 800),
    system_prompt_extra: String(formData.get("system_prompt_extra") ?? ""),
    greeting_en: String(formData.get("greeting_en") ?? "").trim(),
    greeting_ar: String(formData.get("greeting_ar") ?? "").trim(),
    daily_message_cap_per_session: clampInt(
      formData.get("daily_message_cap_per_session"),
      1,
      10_000,
      60,
    ),
    per_minute_cap_per_session: clampInt(
      formData.get("per_minute_cap_per_session"),
      1,
      1_000,
      12,
    ),
  };
  const { error } = await supabase
    .from("motoagent_settings")
    .update(patch)
    .eq("id", 1);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/motoagent");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteMotoagentConversation(
  id: string,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing id." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("motoagent_conversations")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/motoagent/conversations");
  return { ok: true };
}
