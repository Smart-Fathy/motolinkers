import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "MotoAgent conversations — MotoLinkers Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function parsePage(v: string | string[] | undefined): number {
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number(s);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

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

interface ConvoRow {
  id: string;
  session_id: string;
  locale: "en" | "ar";
  country: string | null;
  message_count: number;
  transcript: { role: string; content: string; ts?: string }[] | null;
  started_at: string;
  last_message_at: string;
}

function lastUserMessage(convo: ConvoRow): string {
  const transcript = Array.isArray(convo.transcript) ? convo.transcript : [];
  for (let i = transcript.length - 1; i >= 0; i--) {
    if (transcript[i].role === "user" && transcript[i].content) {
      return transcript[i].content.slice(0, 120);
    }
  }
  return "";
}

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { page: pageRaw } = await searchParams;
  const page = parsePage(pageRaw);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data, error, count } = await supabase
    .from("motoagent_conversations")
    .select(
      "id, session_id, locale, country, message_count, transcript, started_at, last_message_at",
      { count: "exact" },
    )
    .order("last_message_at", { ascending: false })
    .range(from, to);

  const total = count ?? data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = (data ?? []) as unknown as ConvoRow[];

  return (
    <>
      <div className="adm__page-head">
        <div>
          <p style={{ margin: 0, fontSize: ".82rem" }}>
            <Link href="/admin/motoagent" style={{ color: "var(--volt)" }}>
              ← MotoAgent settings
            </Link>
          </p>
          <h1 className="adm__h1">Conversations</h1>
          <p className="adm__sub">
            {total} total · auto-deleted after 30 days
            {totalPages > 1 && ` · page ${safePage} of ${totalPages}`}
          </p>
        </div>
      </div>

      {error && <div className="adm__error">{error.message}</div>}

      {rows.length === 0 ? (
        <p className="adm__sub">No conversations yet.</p>
      ) : (
        <table className="adm__table">
          <thead>
            <tr>
              <th>Last activity</th>
              <th>Locale</th>
              <th>Country</th>
              <th>Messages</th>
              <th>Last user message</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{fmtDate(c.last_message_at)}</td>
                <td>
                  <span className="adm__pill">
                    {c.locale.toUpperCase()}
                  </span>
                </td>
                <td>{c.country ?? "—"}</td>
                <td>{c.message_count}</td>
                <td
                  style={{
                    maxWidth: 380,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: "var(--stone)",
                    fontSize: ".88rem",
                  }}
                >
                  {lastUserMessage(c) || "—"}
                </td>
                <td style={{ textAlign: "right" }}>
                  <Link
                    href={`/admin/motoagent/conversations/${c.id}`}
                    className="adm__btn adm__btn--ghost"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: ".7rem",
            marginTop: "1.4rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {safePage > 1 ? (
            <Link
              href={
                safePage === 2
                  ? "/admin/motoagent/conversations"
                  : `/admin/motoagent/conversations?page=${safePage - 1}`
              }
              className="adm__btn adm__btn--ghost"
            >
              ← Previous
            </Link>
          ) : (
            <span className="adm__btn adm__btn--ghost" style={{ opacity: 0.4 }}>
              ← Previous
            </span>
          )}
          <span style={{ color: "var(--stone)", fontSize: ".82rem" }}>
            Page {safePage} of {totalPages}
          </span>
          {safePage < totalPages ? (
            <Link
              href={`/admin/motoagent/conversations?page=${safePage + 1}`}
              className="adm__btn adm__btn--ghost"
            >
              Next →
            </Link>
          ) : (
            <span className="adm__btn adm__btn--ghost" style={{ opacity: 0.4 }}>
              Next →
            </span>
          )}
        </nav>
      )}
    </>
  );
}
