import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteButton from "./DeleteButton";

export const metadata = { title: "News — MotoLinkers Admin" };

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

export default async function NewsListPage() {
  const supabase = await createClient();
  const { data: news, error } = await supabase
    .from("news")
    .select("id, slug, title, published_at, is_published")
    .order("published_at", { ascending: false, nullsFirst: false });

  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            News<em>room</em>
          </h1>
          <p className="adm__sub">{news?.length ?? 0} articles</p>
        </div>
        <Link href="/admin/news/new" className="adm__btn adm__btn--primary">
          + New article
        </Link>
      </div>

      {error && <div className="adm__error">{error.message}</div>}

      {news && news.length > 0 ? (
        <table className="adm__table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Published date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {news.map((n) => (
              <tr key={n.id}>
                <td>
                  <Link href={`/admin/news/${n.id}/edit`}>{n.title}</Link>
                </td>
                <td>{fmtDate(n.published_at)}</td>
                <td>
                  <span className={`adm__pill adm__pill--${n.is_published ? "on" : "off"}`}>
                    {n.is_published ? "Live" : "Draft"}
                  </span>
                </td>
                <td>
                  <div className="adm__table-actions">
                    <Link href={`/admin/news/${n.id}/edit`} className="adm__btn adm__btn--ghost">
                      Edit
                    </Link>
                    <DeleteButton id={n.id} label={n.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="adm__sub">No articles yet.</p>
      )}
    </>
  );
}
