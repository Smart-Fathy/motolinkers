import VehicleForm from "../VehicleForm";

export const metadata = { title: "New vehicle — MotoLinkers Admin" };

export default function NewVehiclePage() {
  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            New <em>vehicle</em>
          </h1>
          <p className="adm__sub">Add a vehicle to the fleet.</p>
        </div>
      </div>
      <VehicleForm />
    </>
  );
}
