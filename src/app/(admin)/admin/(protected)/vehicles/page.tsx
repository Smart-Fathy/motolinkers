import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteButton from "./DeleteButton";

export const metadata = { title: "Vehicles — MotoLinkers Admin" };

const fmtEgp = (n: number) =>
  new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(n);

export default async function VehiclesListPage() {
  const supabase = await createClient();
  const { data: vehicles, error } = await supabase
    .from("vehicles")
    .select("id, slug, name, origin, type, price_egp, is_published, is_featured")
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            Vehi<em>cles</em>
          </h1>
          <p className="adm__sub">
            {vehicles?.length ?? 0} vehicles · published &amp; unpublished
          </p>
        </div>
        <Link href="/admin/vehicles/new" className="adm__btn adm__btn--primary">
          + New vehicle
        </Link>
      </div>

      {error && <div className="adm__error">{error.message}</div>}

      {vehicles && vehicles.length > 0 ? (
        <table className="adm__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Origin</th>
              <th>Type</th>
              <th>Price (EGP)</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td>
                  <Link href={`/admin/vehicles/${v.id}/edit`}>{v.name}</Link>
                  {v.is_featured && (
                    <span className="adm__pill adm__pill--on" style={{ marginLeft: ".5rem" }}>
                      ★
                    </span>
                  )}
                </td>
                <td>{v.origin.toUpperCase()}</td>
                <td>{v.type.toUpperCase()}</td>
                <td>{fmtEgp(v.price_egp)}</td>
                <td>
                  <span className={`adm__pill adm__pill--${v.is_published ? "on" : "off"}`}>
                    {v.is_published ? "Live" : "Draft"}
                  </span>
                </td>
                <td>
                  <div className="adm__table-actions">
                    <Link href={`/admin/vehicles/${v.id}/edit`} className="adm__btn adm__btn--ghost">
                      Edit
                    </Link>
                    <DeleteButton id={v.id} label={v.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="adm__sub">No vehicles yet.</p>
      )}
    </>
  );
}
