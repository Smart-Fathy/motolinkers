import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard — MotoLinkers Admin" };

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

export default async function DashboardPage() {
  const supabase = await createClient();

  const [vehiclesAll, vehiclesPub, leadsAll, newsAll, recentLeads] =
    await Promise.all([
      supabase.from("vehicles").select("id", { count: "exact", head: true }),
      supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("news").select("id", { count: "exact", head: true }),
      supabase
        .from("leads")
        .select("id, name, vehicle_interest, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            Dash<em>board</em>
          </h1>
          <p className="adm__sub">Snapshot of fleet, news, and lead activity.</p>
        </div>
      </div>

      <div className="adm__stats">
        <div className="adm__stat">
          <div className="adm__stat-label">Vehicles · total</div>
          <div className="adm__stat-value">{vehiclesAll.count ?? 0}</div>
        </div>
        <div className="adm__stat">
          <div className="adm__stat-label">Vehicles · published</div>
          <div className="adm__stat-value">{vehiclesPub.count ?? 0}</div>
        </div>
        <div className="adm__stat">
          <div className="adm__stat-label">News articles</div>
          <div className="adm__stat-value">{newsAll.count ?? 0}</div>
        </div>
        <div className="adm__stat">
          <div className="adm__stat-label">Leads</div>
          <div className="adm__stat-value">{leadsAll.count ?? 0}</div>
        </div>
      </div>

      <div className="adm__page-head" style={{ marginTop: "1rem" }}>
        <div>
          <h2 className="adm__h1" style={{ fontSize: "1.3rem" }}>
            Recent leads
          </h2>
          <p className="adm__sub">Last 5 contact-form submissions.</p>
        </div>
        <Link href="/admin/leads" className="adm__btn adm__btn--ghost">
          View all
        </Link>
      </div>

      {recentLeads.data && recentLeads.data.length > 0 ? (
        <table className="adm__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Vehicle interest</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {recentLeads.data.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{l.vehicle_interest ?? "—"}</td>
                <td>{fmtDate(l.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="adm__sub">No leads yet.</p>
      )}
    </>
  );
}
