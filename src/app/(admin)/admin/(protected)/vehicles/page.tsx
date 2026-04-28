import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteButton from "./DeleteButton";
import SyncAllButton from "./SyncAllButton";

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
    .select(
      "id, slug, name, brand, origin, type, body, price_egp, image_url, is_published, is_featured",
    )
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
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
          <SyncAllButton />
          <Link href="/admin/vehicles/new" className="adm__btn adm__btn--primary">
            + New vehicle
          </Link>
        </div>
      </div>

      {error && <div className="adm__error">{error.message}</div>}

      {vehicles && vehicles.length > 0 ? (
        <table className="adm__table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Brand</th>
              <th>Origin</th>
              <th>Power train</th>
              <th>Body</th>
              <th>Price (EGP)</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td style={{ width: "60px" }}>
                  {v.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.image_url}
                      alt=""
                      className="adm__thumb adm__thumb--row"
                    />
                  ) : (
                    <div className="adm__thumb adm__thumb--row adm__thumb--empty" />
                  )}
                </td>
                <td>
                  <Link href={`/admin/vehicles/${v.id}/edit`}>{v.name}</Link>
                  {v.is_featured && (
                    <span className="adm__pill adm__pill--on" style={{ marginLeft: ".5rem" }}>
                      ★
                    </span>
                  )}
                </td>
                <td>{v.brand ?? "—"}</td>
                <td>{v.origin.toUpperCase()}</td>
                <td>{v.type.toUpperCase()}</td>
                <td>{v.body ? v.body.toUpperCase() : "—"}</td>
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
