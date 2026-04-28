import { createClient } from "@/lib/supabase/server";
import DeleteButton from "./DeleteButton";

export const metadata = { title: "Leads — MotoLinkers Admin" };

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

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            Leads
          </h1>
          <p className="adm__sub">
            {leads?.length ?? 0} leads total
          </p>
        </div>
      </div>

      {error && <div className="adm__error">{error.message}</div>}

      {leads && leads.length > 0 ? (
        <table className="adm__table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Vehicle interest</th>
              <th>Source</th>
              <th>When</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td>{l.email ?? "—"}</td>
                <td>{l.phone ?? "—"}</td>
                <td>{l.vehicle_interest ?? "—"}</td>
                <td>{l.source ?? "—"}</td>
                <td>{fmtDate(l.created_at)}</td>
                <td>
                  <DeleteButton id={l.id} label={l.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="adm__sub">No leads yet.</p>
      )}

      {leads && leads.some((l) => l.message) && (
        <div style={{ marginTop: "2rem" }}>
          <h2 className="adm__h1" style={{ fontSize: "1.2rem" }}>Messages</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem", marginTop: "1rem" }}>
            {leads
              .filter((l) => l.message)
              .map((l) => (
                <div key={l.id} className="adm__stat">
                  <div className="adm__stat-label">
                    {l.name} · {fmtDate(l.created_at)}
                  </div>
                  <p style={{ margin: ".4rem 0 0", fontSize: ".95rem", whiteSpace: "pre-wrap" }}>
                    {l.message}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
