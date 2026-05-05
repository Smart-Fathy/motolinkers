import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteButton from "./DeleteButton";
import EditableCell from "./EditableCell";
import SortSelect from "./SortSelect";
import SyncAllButton from "./SyncAllButton";

export const metadata = { title: "Vehicles — MotoLinkers Admin" };

// Pagination caps the work the worker does per request. Each row
// instantiates ~8 client component boundaries (EditableCell ×8); at
// ~80 vehicles that meant 640 boundaries to serialise per render,
// which trips Cloudflare's CPU limit (Error 1102). 25/page keeps the
// budget comfortably below the threshold while staying practical.
const PAGE_SIZE = 25;

const fmtEgp = (n: number) =>
  new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(n);

const ORIGIN_OPTIONS = [
  { value: "cn", label: "CN" },
  { value: "ae", label: "AE" },
];
const POWERTRAIN_OPTIONS = [
  { value: "ev", label: "EV" },
  { value: "reev", label: "REEV" },
  { value: "phev", label: "PHEV" },
  { value: "hybrid", label: "HYBRID" },
];
const BODY_OPTIONS = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
  { value: "coupe", label: "Coupe" },
  { value: "wagon", label: "Wagon" },
  { value: "pickup", label: "Pickup" },
  { value: "mpv", label: "MPV" },
  { value: "convertible", label: "Convertible" },
];

type SortKey =
  | "newest"
  | "oldest"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc"
  | "brand-asc";

const VALID_SORTS: ReadonlySet<SortKey> = new Set([
  "newest",
  "oldest",
  "name-asc",
  "name-desc",
  "price-asc",
  "price-desc",
  "brand-asc",
]);

function parseSort(v: string | string[] | undefined): SortKey {
  const s = Array.isArray(v) ? v[0] : v;
  return s && VALID_SORTS.has(s as SortKey) ? (s as SortKey) : "newest";
}

// `nullsFirst: false` on the brand/price orderings keeps rows with a
// missing value at the bottom instead of bubbling them to the top.
const ORDER_BY: Record<
  SortKey,
  { column: string; ascending: boolean; nullsFirst?: boolean }
> = {
  newest: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  "name-asc": { column: "name", ascending: true },
  "name-desc": { column: "name", ascending: false },
  "price-asc": { column: "price_egp", ascending: true },
  "price-desc": { column: "price_egp", ascending: false },
  "brand-asc": { column: "brand", ascending: true, nullsFirst: false },
};

function parsePage(v: string | string[] | undefined): number {
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number(s);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export default async function VehiclesListPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string | string[]; page?: string | string[] }>;
}) {
  const { sort: sortRaw, page: pageRaw } = await searchParams;
  const sort = parseSort(sortRaw);
  const order = ORDER_BY[sort];
  const page = parsePage(pageRaw);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();
  const { data: vehicles, error, count } = await supabase
    .from("vehicles")
    .select(
      "id, slug, name, brand, trim, origin, type, body, price_egp, image_url, is_published, is_featured",
      { count: "exact" },
    )
    .order(order.column, {
      ascending: order.ascending,
      nullsFirst: order.nullsFirst,
    })
    .range(from, to);

  const total = count ?? vehicles?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const baseQs = new URLSearchParams();
  if (sort !== "newest") baseQs.set("sort", sort);
  const linkFor = (p: number) => {
    const qs = new URLSearchParams(baseQs);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `/admin/vehicles?${s}` : "/admin/vehicles";
  };

  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            Vehi<em>cles</em>
          </h1>
          <p className="adm__sub">
            {total} vehicles · published &amp; unpublished
            {totalPages > 1 && (
              <>
                {" · "}
                page {safePage} of {totalPages}
              </>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
          <SortSelect value={sort} />
          <Link href="/admin/vehicles/import" className="adm__btn adm__btn--ghost">
            Import CSV / Sheet
          </Link>
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
              <th>Trim</th>
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
                  <EditableCell
                    id={v.id}
                    field="name"
                    kind="text"
                    value={v.name}
                  />
                  {v.is_featured && (
                    <span
                      className="adm__pill adm__pill--on"
                      style={{ marginLeft: ".5rem" }}
                    >
                      ★
                    </span>
                  )}
                </td>
                <td>
                  <EditableCell
                    id={v.id}
                    field="brand"
                    kind="text"
                    value={v.brand}
                    placeholder="Brand"
                  />
                </td>
                <td>
                  <EditableCell
                    id={v.id}
                    field="trim"
                    kind="text"
                    value={v.trim}
                    placeholder="Trim"
                  />
                </td>
                <td>
                  <EditableCell
                    id={v.id}
                    field="origin"
                    kind="select"
                    value={v.origin}
                    options={ORIGIN_OPTIONS}
                  />
                </td>
                <td>
                  <EditableCell
                    id={v.id}
                    field="type"
                    kind="select"
                    value={v.type}
                    options={POWERTRAIN_OPTIONS}
                  />
                </td>
                <td>
                  <EditableCell
                    id={v.id}
                    field="body"
                    kind="select"
                    value={v.body}
                    options={BODY_OPTIONS}
                    allowEmpty
                    emptyLabel="—"
                  />
                </td>
                <td>
                  <EditableCell
                    id={v.id}
                    field="price_egp"
                    kind="number"
                    value={v.price_egp}
                    displayValue={fmtEgp(v.price_egp)}
                  />
                </td>
                <td>
                  <EditableCell
                    id={v.id}
                    field="is_published"
                    kind="toggle"
                    value={v.is_published}
                    onLabel="Live"
                    offLabel="Draft"
                  />
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

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
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
            <Link href={linkFor(safePage - 1)} className="adm__btn adm__btn--ghost">
              ← Previous
            </Link>
          ) : (
            <span className="adm__btn adm__btn--ghost" aria-disabled style={{ opacity: 0.4 }}>
              ← Previous
            </span>
          )}
          <span style={{ color: "var(--stone)", fontSize: ".82rem" }}>
            Page {safePage} of {totalPages}
          </span>
          {safePage < totalPages ? (
            <Link href={linkFor(safePage + 1)} className="adm__btn adm__btn--ghost">
              Next →
            </Link>
          ) : (
            <span className="adm__btn adm__btn--ghost" aria-disabled style={{ opacity: 0.4 }}>
              Next →
            </span>
          )}
        </nav>
      )}
    </>
  );
}
