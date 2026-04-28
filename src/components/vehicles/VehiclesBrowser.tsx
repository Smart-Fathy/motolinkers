"use client";

import { useMemo, useState } from "react";
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
  { value: "coupe", label: "Coupe" },
  { value: "wagon", label: "Wagon" },
  { value: "pickup", label: "Pickup" },
  { value: "mpv", label: "MPV" },
  { value: "convertible", label: "Convertible" },
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

  const [sort, setSort] = useState<SortKey>("default");
  const [brandSel, setBrandSel] = useState<Set<string>>(new Set());
  const [modelSel, setModelSel] = useState<Set<string>>(new Set());
  const [powerSel, setPowerSel] = useState<Set<VehiclePowerTrain>>(new Set());
  const [bodySel, setBodySel] = useState<Set<VehicleBody>>(new Set());
  const [driveSel, setDriveSel] = useState<Set<VehicleDriveType>>(new Set());
  const [originSel, setOriginSel] = useState<Set<"cn" | "ae">>(new Set());
  const [price, setPrice] = useState<[number, number]>(priceBounds);
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    setOriginSel(new Set());
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
      if (originSel.size && !originSel.has(v.origin)) return false;
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
  }, [vehicles, brandSel, modelSel, powerSel, bodySel, driveSel, originSel, price, sort]);

  const activeCount =
    brandSel.size +
    modelSel.size +
    powerSel.size +
    bodySel.size +
    driveSel.size +
    originSel.size +
    (price[0] !== priceBounds[0] || price[1] !== priceBounds[1] ? 1 : 0);

  return (
    <div className="vbrowse">
      <aside
        className={`vbrowse__panel${filtersOpen ? " is-open" : ""}`}
        aria-label="Filters"
      >
        <div className="vbrowse__panel-head">
          <h2 className="vbrowse__panel-title">Filters</h2>
          {activeCount > 0 && (
            <button type="button" className="vbrowse__clear" onClick={clearAll}>
              Clear ({activeCount})
            </button>
          )}
          <button
            type="button"
            className="vbrowse__panel-close"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
          >
            ×
          </button>
        </div>

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

        <FilterGroup title="Origin">
          <Check
            label="China"
            checked={originSel.has("cn")}
            onChange={() => setOriginSel((s) => toggle(s, "cn"))}
          />
          <Check
            label="UAE"
            checked={originSel.has("ae")}
            onChange={() => setOriginSel((s) => toggle(s, "ae"))}
          />
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
        </div>

        {filtered.length === 0 ? (
          <p className="vbrowse__empty">
            No vehicles match these filters.{" "}
            <button type="button" className="vbrowse__inline-clear" onClick={clearAll}>
              Clear filters
            </button>
          </p>
        ) : (
          <div className="vbrowse__grid">
            {filtered.map((car) => (
              <VehicleCard key={car.id} car={car} />
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
    <details className="vbrowse__group" open>
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
