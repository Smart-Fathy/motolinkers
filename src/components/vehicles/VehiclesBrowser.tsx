"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VehicleCard from "@/components/ui/VehicleCard";
import PriceRange from "./PriceRange";
import type {
  Vehicle,
  VehicleBody,
  VehicleDriveType,
  VehiclePowerTrain,
} from "@/data/vehicles";

type SortKey = "default" | "newest" | "oldest" | "price-asc" | "price-desc";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "default", label: "Default" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price-asc", label: "Lowest price" },
  { value: "price-desc", label: "Highest price" },
];

const POWER_TRAINS: { value: VehiclePowerTrain; label: string }[] = [
  { value: "ev", label: "Electric" },
  { value: "reev", label: "Range-extended" },
  { value: "phev", label: "Plug-in hybrid" },
  { value: "hybrid", label: "Hybrid" },
];

const BODIES: { value: VehicleBody; label: string }[] = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
];

const DRIVE_TYPES: { value: VehicleDriveType; label: string }[] = [
  { value: "fwd", label: "FWD" },
  { value: "rwd", label: "RWD" },
  { value: "awd", label: "AWD" },
  { value: "4wd", label: "4WD" },
];

const formatEgp = (n: number) =>
  new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(n);

function ts(d?: string): number {
  return d ? new Date(d).getTime() : 0;
}

export default function VehiclesBrowser({ vehicles }: { vehicles: Vehicle[] }) {
  // Derived option sets — only show filters with options the data supports.
  const brands = useMemo(() => {
    const s = new Set<string>();
    for (const v of vehicles) if (v.brand) s.add(v.brand);
    return [...s].sort();
  }, [vehicles]);

  const models = useMemo(() => {
    const s = new Set<string>();
    for (const v of vehicles) if (v.model) s.add(v.model);
    return [...s].sort();
  }, [vehicles]);

  const priceBounds = useMemo(() => {
    if (vehicles.length === 0) return [0, 1] as [number, number];
    const prices = vehicles.map((v) => v.price);
    return [Math.min(...prices), Math.max(...prices)] as [number, number];
  }, [vehicles]);

  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<SortKey>("default");
  const [brandSel, setBrandSel] = useState<Set<string>>(new Set());
  const [modelSel, setModelSel] = useState<Set<string>>(new Set());
  const [powerSel, setPowerSel] = useState<Set<VehiclePowerTrain>>(new Set());
  const [bodySel, setBodySel] = useState<Set<VehicleBody>>(new Set());
  const [driveSel, setDriveSel] = useState<Set<VehicleDriveType>>(new Set());
  const [price, setPrice] = useState<[number, number]>(priceBounds);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Lock body scroll while the drawer is open, and close on Esc.
  useEffect(() => {
    if (!filtersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const clearAll = () => {
    setBrandSel(new Set());
    setModelSel(new Set());
    setPowerSel(new Set());
    setBodySel(new Set());
    setDriveSel(new Set());
    setPrice(priceBounds);
  };

  const filtered = useMemo(() => {
    const out = vehicles.filter((v) => {
      if (brandSel.size && (!v.brand || !brandSel.has(v.brand))) return false;
      if (modelSel.size && (!v.model || !modelSel.has(v.model))) return false;
      if (powerSel.size) {
        const pt = (v.powerTrain ?? v.type) as VehiclePowerTrain;
        if (!powerSel.has(pt)) return false;
      }
      if (bodySel.size && (!v.body || !bodySel.has(v.body))) return false;
      if (driveSel.size && (!v.driveType || !driveSel.has(v.driveType))) return false;
      if (v.price < price[0] || v.price > price[1]) return false;
      return true;
    });

    switch (sort) {
      case "newest":
        return [...out].sort((a, b) => ts(b.createdAt) - ts(a.createdAt));
      case "oldest":
        return [...out].sort((a, b) => ts(a.createdAt) - ts(b.createdAt));
      case "price-asc":
        return [...out].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...out].sort((a, b) => b.price - a.price);
      default:
        return out;
    }
  }, [vehicles, brandSel, modelSel, powerSel, bodySel, driveSel, price, sort]);

  const priceFilterActive =
    price[0] !== priceBounds[0] || price[1] !== priceBounds[1];

  const activeCount =
    brandSel.size +
    modelSel.size +
    powerSel.size +
    bodySel.size +
    driveSel.size +
    (priceFilterActive ? 1 : 0);

  type Chip = { key: string; label: string; onRemove: () => void };
  const chips: Chip[] = [];
  for (const b of brandSel)
    chips.push({
      key: `brand:${b}`,
      label: b,
      onRemove: () => setBrandSel((s) => toggle(s, b)),
    });
  for (const m of modelSel)
    chips.push({
      key: `model:${m}`,
      label: m,
      onRemove: () => setModelSel((s) => toggle(s, m)),
    });
  for (const p of powerSel) {
    const meta = POWER_TRAINS.find((x) => x.value === p);
    chips.push({
      key: `power:${p}`,
      label: meta?.label ?? p,
      onRemove: () => setPowerSel((s) => toggle(s, p)),
    });
  }
  for (const b of bodySel) {
    const meta = BODIES.find((x) => x.value === b);
    chips.push({
      key: `body:${b}`,
      label: meta?.label ?? b,
      onRemove: () => setBodySel((s) => toggle(s, b)),
    });
  }
  for (const d of driveSel) {
    const meta = DRIVE_TYPES.find((x) => x.value === d);
    chips.push({
      key: `drive:${d}`,
      label: meta?.label ?? d,
      onRemove: () => setDriveSel((s) => toggle(s, d)),
    });
  }
  if (priceFilterActive) {
    chips.push({
      key: "price",
      label: `${formatEgp(price[0])} – ${formatEgp(price[1])}`,
      onRemove: () => setPrice(priceBounds),
    });
  }

  return (
    <div className="vbrowse">
      <aside
        className={`vbrowse__panel${filtersOpen ? " is-open" : ""}`}
        aria-label="Filters"
        aria-hidden={!filtersOpen}
      >
        <div className="vbrowse__panel-head">
          <h2 className="vbrowse__panel-title">Filters</h2>
          <button
            type="button"
            className="vbrowse__panel-close"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
          >
            ×
          </button>
        </div>

        <div className="vbrowse__panel-body">
          {brands.length > 0 && (
            <FilterGroup title="Brand">
              {brands.map((b) => (
                <Check
                  key={b}
                  label={b}
                  checked={brandSel.has(b)}
                  onChange={() => setBrandSel((s) => toggle(s, b))}
                />
              ))}
            </FilterGroup>
          )}

          {models.length > 0 && (
            <FilterGroup title="Model">
              {models.map((m) => (
                <Check
                  key={m}
                  label={m}
                  checked={modelSel.has(m)}
                  onChange={() => setModelSel((s) => toggle(s, m))}
                />
              ))}
            </FilterGroup>
          )}

          <FilterGroup title="Power train">
            {POWER_TRAINS.map((p) => (
              <Check
                key={p.value}
                label={p.label}
                checked={powerSel.has(p.value)}
                onChange={() => setPowerSel((s) => toggle(s, p.value))}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Body">
            {BODIES.map((b) => (
              <Check
                key={b.value}
                label={b.label}
                checked={bodySel.has(b.value)}
                onChange={() => setBodySel((s) => toggle(s, b.value))}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Drive type">
            {DRIVE_TYPES.map((d) => (
              <Check
                key={d.value}
                label={d.label}
                checked={driveSel.has(d.value)}
                onChange={() => setDriveSel((s) => toggle(s, d.value))}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Price (EGP)">
            <PriceRange
              min={priceBounds[0]}
              max={priceBounds[1]}
              step={Math.max(1, Math.round((priceBounds[1] - priceBounds[0]) / 200))}
              value={price}
              onChange={setPrice}
              format={formatEgp}
            />
          </FilterGroup>
        </div>

        <div className="vbrowse__panel-foot">
          <button
            type="button"
            className="vbrowse__clear"
            onClick={clearAll}
            disabled={activeCount === 0}
          >
            Clear all
          </button>
          <button
            type="button"
            className="vbrowse__apply"
            onClick={() => setFiltersOpen(false)}
          >
            Show {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </button>
        </div>
      </aside>

      <div className="vbrowse__main">
        <div className="vbrowse__toolbar">
          <button
            type="button"
            className="vbrowse__filters-toggle"
            onClick={() => setFiltersOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M6 12h12M10 18h4" />
            </svg>
            Filters{activeCount > 0 ? ` · ${activeCount}` : ""}
          </button>
          <span className="vbrowse__count">
            {filtered.length} of {vehicles.length}
          </span>
          <label className="vbrowse__sort">
            <span>Sort by</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <div className="vbrowse__view" role="group" aria-label="View">
            <button
              type="button"
              className={`vbrowse__view-btn${view === "grid" ? " is-on" : ""}`}
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              title="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              type="button"
              className={`vbrowse__view-btn${view === "list" ? " is-on" : ""}`}
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="vbrowse__chips" aria-label="Active filters">
            {chips.map((c) => (
              <button
                type="button"
                key={c.key}
                className="vbrowse__chip"
                onClick={c.onRemove}
                aria-label={`Remove ${c.label} filter`}
              >
                <span>{c.label}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            ))}
            <button
              type="button"
              className="vbrowse__chips-clear"
              onClick={clearAll}
            >
              Clear all
            </button>
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="vbrowse__empty">
            No vehicles match these filters.{" "}
            <button type="button" className="vbrowse__inline-clear" onClick={clearAll}>
              Clear filters
            </button>
          </p>
        ) : view === "grid" ? (
          <div className="vbrowse__grid">
            {filtered.map((car) => (
              <VehicleCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className="vbrowse__list">
            {filtered.map((car) => (
              <VehicleListRow key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>

      {filtersOpen && (
        <div
          className="vbrowse__scrim"
          onClick={() => setFiltersOpen(false)}
          aria-hidden
        />
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="vbrowse__group">
      <summary>{title}</summary>
      <div className="vbrowse__group-body">{children}</div>
    </details>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className={`vbrowse__check${checked ? " is-on" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function VehicleListRow({ car }: { car: Vehicle }) {
  const subtitle = [car.brand, car.trim ?? car.model, String(car.year)]
    .filter((s): s is string => Boolean(s))
    .join(" · ");
  const meta = [
    car.body ? car.body.toUpperCase() : null,
    car.driveType ? car.driveType.toUpperCase() : null,
    car.drive,
    car.trans,
  ]
    .filter((s): s is string => Boolean(s))
    .join(" · ");
  return (
    <Link href={`/vehicles/${car.id}`} className="vbrowse__row" data-hover>
      <div
        className="vbrowse__row-img"
        style={car.img ? { backgroundImage: `url('${car.img}')` } : undefined}
      />
      <div className="vbrowse__row-body">
        <div className="vbrowse__row-titles">
          <h3>{car.name}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {meta && <div className="vbrowse__row-meta">{meta}</div>}
      </div>
      <div className="vbrowse__row-price">
        <strong>{formatEgp(car.price)}</strong>
        <span className="vbrowse__row-cta">View →</span>
      </div>
    </Link>
  );
}
