import { createClient } from "@/lib/supabase/server";
import CalculatorConfigForm from "./CalculatorConfigForm";

export const metadata = { title: "Calculator config — MotoLinkers Admin" };

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default async function CalculatorConfigPage() {
  const supabase = await createClient();
  const { data: config, error } = await supabase
    .from("calculator_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !config) {
    return (
      <>
        <div className="adm__page-head">
          <h1 className="adm__h1">Calculator</h1>
        </div>
        <div className="adm__error">
          Could not load `calculator_config` row (id = 1). Make sure the row
          exists in Supabase. {error?.message}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            Calcu<em>lator</em>
          </h1>
          <p className="adm__sub">
            Edits here re-render `/` and `/calculator` immediately.
            <br />
            Last updated: {fmtDate(config.updated_at)}
          </p>
        </div>
      </div>
      <CalculatorConfigForm config={config} />
    </>
  );
}
