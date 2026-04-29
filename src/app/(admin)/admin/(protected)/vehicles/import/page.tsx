import { createClient } from "@/lib/supabase/server";
import ImportWizard from "./ImportWizard";

export const metadata = { title: "Import vehicles — MotoLinkers Admin" };
export const dynamic = "force-dynamic";

export default async function ImportPage() {
  // Used by the wizard's "update existing" radio so the admin can pick
  // a vehicle to overwrite.
  const supabase = await createClient();
  const { data: existingVehicles } = await supabase
    .from("vehicles")
    .select("id, slug, name")
    .order("name", { ascending: true });

  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            Im<em>port</em> vehicles
          </h1>
          <p className="adm__sub">
            Upload a CSV or paste a Google Sheets URL. Each variant column
            becomes a vehicle; rows with ●/○ values land in the per-vehicle
            feature list.
          </p>
        </div>
      </div>

      <ImportWizard existingVehicles={existingVehicles ?? []} />
    </>
  );
}
