import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import VehicleForm from "../../VehicleForm";

export const metadata = { title: "Edit vehicle — MotoLinkers Admin" };

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!vehicle) notFound();

  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            Edit <em>{vehicle.name}</em>
          </h1>
          <p className="adm__sub">/{vehicle.slug}</p>
        </div>
      </div>
      <VehicleForm vehicle={vehicle} />
    </>
  );
}
