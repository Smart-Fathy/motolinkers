import Grain from "@/components/layout/Grain";
import CustomCursor from "@/components/layout/CustomCursor";
import Loader from "@/components/layout/Loader";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageEventBeacon from "@/components/analytics/PageEventBeacon";
import MotoAgentWidget from "@/components/motoagent/MotoAgentWidget";
import { createPublicClient } from "@/lib/supabase/public";

// Fetch the MotoAgent settings here so the widget knows its greeting +
// enabled state without an extra round-trip on the client. Returns
// null if the table doesn't exist yet (migration 008 not applied).
async function getMotoagentPublicSettings() {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("motoagent_settings")
      .select("is_enabled, greeting_en, greeting_ar")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      console.error("[motoagent] settings read error:", error);
      return null;
    }
    return data ?? null;
  } catch (e) {
    console.error("[motoagent] settings read threw:", e);
    return null;
  }
}

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const motoagentSettings = await getMotoagentPublicSettings();

  return (
    <>
      <Grain />
      <CustomCursor />
      <Loader />
      <Navbar />
      {children}
      <Footer />
      {/* Records a page_events row on every public page navigation. */}
      <PageEventBeacon />
      {/* Floating bilingual chat — hidden if disabled in admin. */}
      <MotoAgentWidget settings={motoagentSettings} />
    </>
  );
}
