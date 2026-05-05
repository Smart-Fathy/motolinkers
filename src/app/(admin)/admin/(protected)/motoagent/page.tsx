import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export const metadata = { title: "MotoAgent — MotoLinkers Admin" };
export const dynamic = "force-dynamic";

type Settings = {
  is_enabled: boolean;
  model: string;
  temperature: number;
  max_output_tokens: number;
  system_prompt_extra: string;
  greeting_en: string;
  greeting_ar: string;
  daily_message_cap_per_session: number;
  per_minute_cap_per_session: number;
};

const DEFAULT_SETTINGS: Settings = {
  is_enabled: true,
  model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  temperature: 0.6,
  max_output_tokens: 800,
  system_prompt_extra: "",
  greeting_en: "Hi! I'm the MotoLinkers assistant. Ask me anything about importing your next EV.",
  greeting_ar: "مرحباً! أنا مساعد MotoLinkers. اسألني أي شيء عن استيراد سيارتك الكهربائية القادمة.",
  daily_message_cap_per_session: 60,
  per_minute_cap_per_session: 12,
};

export default async function MotoagentSettingsPage() {
  const supabase = await createClient();
  const settingsRes = await supabase
    .from("motoagent_settings")
    .select(
      "is_enabled, model, temperature, max_output_tokens, system_prompt_extra, greeting_en, greeting_ar, daily_message_cap_per_session, per_minute_cap_per_session",
    )
    .eq("id", 1)
    .maybeSingle();
  const settings: Settings =
    (settingsRes.data as unknown as Settings | null) ?? DEFAULT_SETTINGS;

  // Lightweight stat: conversations in last 7 days.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const recentRes = await supabase
    .from("motoagent_conversations")
    .select("id", { count: "exact", head: true })
    .gte("started_at", sevenDaysAgo);

  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            Moto<em>Agent</em>
          </h1>
          <p className="adm__sub">
            Bilingual chat assistant. {recentRes.count ?? 0} conversations in the
            last 7 days.
          </p>
        </div>
        <Link href="/admin/motoagent/conversations" className="adm__btn adm__btn--ghost">
          View conversations
        </Link>
      </div>
      <SettingsForm initial={settings} />
    </>
  );
}
