import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PAGE_REGISTRY } from "../pages/PAGE_REGISTRY";

export const metadata = { title: "Analytics — MotoLinkers Admin" };
export const dynamic = "force-dynamic";

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

function parseRange(v: string | string[] | undefined): 7 | 30 | 90 {
  const s = Array.isArray(v) ? v[0] : v;
  if (s === "30") return 30;
  if (s === "90") return 90;
  return 7;
}

function nDaysAgoIso(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US").format(n);

const fmtPct = (n: number) =>
  `${(n * 100).toFixed(0)}%`;

// Friendly path label — admin pages registry first, then the
// vehicle-detail special case. Fallback is the raw path so unknown
// routes are still legible.
function friendlyPath(path: string, nameByVehicleSlug: Map<string, string>): string {
  const reg = PAGE_REGISTRY.find((p) => p.publicPath === path);
  if (reg) return reg.label;
  const m = path.match(/^\/vehicles\/([^/]+)$/);
  if (m) {
    const name = nameByVehicleSlug.get(m[1]);
    return name ? `Vehicle · ${name}` : `Vehicle · ${m[1]}`;
  }
  if (path.match(/^\/news\/([^/]+)$/)) return `News · ${path.split("/").pop()}`;
  return path;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const { range: rangeRaw } = await searchParams;
  const range = parseRange(rangeRaw);
  const since = nDaysAgoIso(range);

  type EventRow = {
    session_id: string;
    path: string;
    vehicle_slug: string | null;
    country: string | null;
    city: string | null;
    device: "mobile" | "tablet" | "desktop" | null;
    referrer_kind: "direct" | "search" | "social" | "other" | null;
    is_new_visitor: boolean;
    created_at: string;
  };
  type VehicleRow = { slug: string; name: string; price_egp: number };

  const supabase = await createClient();

  // One bulk read of the relevant slice — every chart slices it
  // client-rendered on the server. Keeps the work to ONE query.
  // Cap at 100k rows to stay inside the worker CPU budget.
  const eventsRes = await supabase
    .from("page_events")
    .select(
      "session_id, path, vehicle_slug, country, city, device, referrer_kind, is_new_visitor, created_at",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(100_000);
  const error = eventsRes.error;
  const rows: EventRow[] = (eventsRes.data ?? []) as unknown as EventRow[];

  // Vehicles join (name + price) for friendly labels and price-band chart.
  const vehiclesRes = await supabase
    .from("vehicles")
    .select("slug, name, price_egp");
  const vehicles: VehicleRow[] = (vehiclesRes.data ?? []) as unknown as VehicleRow[];
  const nameByVehicleSlug = new Map<string, string>(
    vehicles.map((v) => [v.slug, v.name]),
  );
  const priceByVehicleSlug = new Map<string, number>(
    vehicles.map((v) => [v.slug, Number(v.price_egp)]),
  );

  // ─── aggregations ──────────────────────────────────────────────
  const totalEvents = rows.length;
  const uniqueSessions = new Set(rows.map((r) => r.session_id)).size;
  const newVisitorEvents = rows.filter((r) => r.is_new_visitor).length;
  const newVisitorPct = totalEvents > 0 ? newVisitorEvents / totalEvents : 0;

  const countryCounts = countBy(rows, (r) => r.country ?? "—");
  const topCountry =
    [...countryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const pathCounts = topN(countBy(rows, (r) => r.path), 12);
  const vehicleCounts = topN(
    countBy(
      rows.filter((r) => r.vehicle_slug),
      (r) => r.vehicle_slug as string,
    ),
    10,
  );
  const cityCounts = topN(
    countBy(
      rows.filter((r) => r.country === "EG" && r.city),
      (r) => r.city as string,
    ),
    10,
  );
  const deviceCounts = countBy(rows, (r) => r.device ?? "desktop");
  const referrerCounts = countBy(rows, (r) => r.referrer_kind ?? "direct");
  const newVsReturning = new Map([
    ["New", newVisitorEvents],
    ["Returning", totalEvents - newVisitorEvents],
  ]);

  // Price-range demand from vehicle views.
  const PRICE_BANDS: { min: number; max: number; label: string }[] = [
    { min: 0, max: 1_000_000, label: "< 1M" },
    { min: 1_000_000, max: 2_000_000, label: "1–2M" },
    { min: 2_000_000, max: 3_000_000, label: "2–3M" },
    { min: 3_000_000, max: 5_000_000, label: "3–5M" },
    { min: 5_000_000, max: Number.POSITIVE_INFINITY, label: "5M+" },
  ];
  const priceBandCounts = new Map<string, number>(
    PRICE_BANDS.map((b) => [b.label, 0] as const),
  );
  for (const r of rows) {
    if (!r.vehicle_slug) continue;
    const p = priceByVehicleSlug.get(r.vehicle_slug);
    if (p === undefined) continue;
    const band = PRICE_BANDS.find((b) => p >= b.min && p < b.max);
    if (band) priceBandCounts.set(band.label, (priceBandCounts.get(band.label) ?? 0) + 1);
  }

  return (
    <>
      <div className="adm__page-head">
        <div>
          <h1 className="adm__h1">
            Ana<em>lytics</em>
          </h1>
          <p className="adm__sub">
            {fmt(totalEvents)} page events · {fmt(uniqueSessions)} sessions ·{" "}
            {RANGE_OPTIONS.find((o) => Number(o.value) === range)?.label}
          </p>
        </div>
        <RangePicker current={range} />
      </div>

      {error && <div className="adm__error">{error.message}</div>}

      {/* KPIs */}
      <div className="adm__stats" style={{ marginTop: "1rem" }}>
        <div className="adm__stat">
          <div className="adm__stat-label">Page views</div>
          <div className="adm__stat-value">{fmt(totalEvents)}</div>
        </div>
        <div className="adm__stat">
          <div className="adm__stat-label">Unique sessions</div>
          <div className="adm__stat-value">{fmt(uniqueSessions)}</div>
        </div>
        <div className="adm__stat">
          <div className="adm__stat-label">New visitors</div>
          <div className="adm__stat-value">{fmtPct(newVisitorPct)}</div>
        </div>
        <div className="adm__stat">
          <div className="adm__stat-label">Top country</div>
          <div className="adm__stat-value">{topCountry}</div>
        </div>
      </div>

      {/* Two-column layout for the bigger panels */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.4rem",
          marginTop: "1.4rem",
        }}
      >
        <Panel title="Most-visited pages">
          <BarList
            rows={pathCounts.map(([key, count]) => ({
              key,
              label: friendlyPath(key, nameByVehicleSlug),
              count,
            }))}
            empty="No page views yet."
          />
        </Panel>

        <Panel title="Most-visited vehicles">
          <BarList
            rows={vehicleCounts.map(([key, count]) => ({
              key,
              label: nameByVehicleSlug.get(key) ?? key,
              href: `/admin/vehicles?sort=newest`,
              count,
            }))}
            empty="No vehicle views yet."
          />
        </Panel>

        <Panel title="Cities (Egypt)">
          <BarList
            rows={cityCounts.map(([key, count]) => ({ key, label: key, count }))}
            empty="No Egypt traffic in this window."
          />
        </Panel>

        <Panel title="Price-range demand (vehicle views)">
          <BarList
            rows={PRICE_BANDS.map((b) => ({
              key: b.label,
              label: `${b.label} EGP`,
              count: priceBandCounts.get(b.label) ?? 0,
            }))}
            empty="No vehicle views to bin yet."
            preserveOrder
          />
        </Panel>

        <Panel title="Device split">
          <BarList
            rows={["mobile", "tablet", "desktop"].map((k) => ({
              key: k,
              label: k.charAt(0).toUpperCase() + k.slice(1),
              count: deviceCounts.get(k) ?? 0,
            }))}
            empty="No data."
            preserveOrder
          />
        </Panel>

        <Panel title="Referrer split">
          <BarList
            rows={["direct", "search", "social", "other"].map((k) => ({
              key: k,
              label: k.charAt(0).toUpperCase() + k.slice(1),
              count: referrerCounts.get(k) ?? 0,
            }))}
            empty="No data."
            preserveOrder
          />
        </Panel>

        <Panel title="New vs returning visitors">
          <BarList
            rows={[...newVsReturning.entries()].map(([k, count]) => ({
              key: k,
              label: k,
              count,
            }))}
            empty="No data."
            preserveOrder
          />
        </Panel>

        <Panel title="Country split">
          <BarList
            rows={topN([...countryCounts.entries()], 10).map(([k, count]) => ({
              key: k,
              label: k,
              count,
            }))}
            empty="No data."
          />
        </Panel>
      </div>
    </>
  );
}

// ─── small bits ──────────────────────────────────────────────────

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "var(--ink-2)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "1rem 1.2rem 1.2rem",
        minWidth: 0,
      }}
    >
      <h2
        style={{
          margin: "0 0 .9rem",
          fontFamily: "var(--ff-mono)",
          fontSize: ".74rem",
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "var(--stone)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function BarList({
  rows,
  empty,
  preserveOrder = false,
}: {
  rows: { key: string; label: string; count: number; href?: string }[];
  empty: string;
  preserveOrder?: boolean;
}) {
  const filtered = rows.filter((r) => r.count > 0 || preserveOrder);
  if (filtered.length === 0) {
    return (
      <p style={{ color: "var(--stone)", fontSize: ".85rem", margin: 0 }}>{empty}</p>
    );
  }
  const max = Math.max(1, ...filtered.map((r) => r.count));
  const ordered = preserveOrder
    ? filtered
    : filtered.slice().sort((a, b) => b.count - a.count);

  return (
    <ol
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: ".55rem",
      }}
    >
      {ordered.map((r) => {
        const pct = (r.count / max) * 100;
        return (
          <li key={r.key}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontSize: ".85rem",
                color: "var(--bone)",
                gap: "1rem",
                marginBottom: ".25rem",
              }}
            >
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.href ? (
                  <Link href={r.href} style={{ color: "inherit" }} data-hover>
                    {r.label}
                  </Link>
                ) : (
                  r.label
                )}
              </span>
              <span
                style={{
                  fontFamily: "var(--ff-mono)",
                  fontSize: ".78rem",
                  color: "var(--stone)",
                  flexShrink: 0,
                }}
              >
                {fmt(r.count)}
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: 6,
                borderRadius: 3,
                background: "rgba(232,208,140,.08)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${Math.max(2, pct)}%`,
                  background: "linear-gradient(90deg, var(--volt), rgba(232,208,140,.4))",
                  borderRadius: 3,
                }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function RangePicker({ current }: { current: 7 | 30 | 90 }) {
  return (
    <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
      {RANGE_OPTIONS.map((o) => {
        const isActive = String(current) === o.value;
        const href = o.value === "7" ? "/admin/analytics" : `/admin/analytics?range=${o.value}`;
        return (
          <Link
            key={o.value}
            href={href}
            className={`adm__btn ${isActive ? "adm__btn--primary" : "adm__btn--ghost"}`}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}

// ─── tiny aggregation helpers (no lodash dep) ────────────────────

function countBy<T>(rows: T[], key: (r: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = key(r);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function topN<K>(entries: Iterable<[K, number]>, n: number): [K, number][] {
  return [...entries].sort((a, b) => b[1] - a[1]).slice(0, n);
}
