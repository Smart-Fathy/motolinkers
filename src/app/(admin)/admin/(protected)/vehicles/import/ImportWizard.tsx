"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { slugify } from "@/lib/utils";
import {
  applyAutohomeScrape,
  applyImport,
  previewAutohomeImport,
  previewImport,
  type ApplyAutohomePayload,
  type ApplyAutohomeResult,
  type ApplyPayload,
  type ApplyResult,
  type AutohomeDecision,
  type AutohomeScrape,
  type PreviewAutohomeResult,
  type PreviewResult,
  type SpecMappedTo,
  type SpecRow,
  type VariantColumn,
  type VariantDecision,
} from "./import-actions";

// Field-level diff used by the autohome-URL flow. Each diffable field
// of AutohomeScrape gets a row in the preview table; the admin ticks
// which ones to apply to the new vehicle row.
const AUTOHOME_DIFF_FIELDS: { key: string; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "trim", label: "Trim" },
  { key: "year", label: "Year" },
  { key: "body", label: "Body" },
  { key: "range_km", label: "Range (km)" },
  { key: "motor_power_ps", label: "Motor power (PS)" },
  { key: "battery_kwh", label: "Battery (kWh)" },
  { key: "top_speed_kmh", label: "Top speed (km/h)" },
  { key: "acceleration_0_100", label: "0–100 km/h (s)" },
  { key: "drivetrain", label: "Drivetrain" },
  { key: "transmission", label: "Transmission" },
  { key: "seats", label: "Seats" },
  { key: "features", label: "Features" },
];

function formatAutohomeField(key: string, scrape: AutohomeScrape): string {
  if (key === "features") {
    const f = scrape.features;
    if (!f) return "";
    const total = Object.values(f).reduce((n, arr) => n + arr.length, 0);
    const sections = Object.keys(f).length;
    return `${total} items across ${sections} section${sections === 1 ? "" : "s"}`;
  }
  const v = (scrape as unknown as Record<string, unknown>)[key];
  if (v === undefined || v === null || v === "") return "";
  return String(v);
}

type ExistingVehicle = { id: string; slug: string; name: string };

const SPEC_LABELS: Record<SpecMappedTo, string> = {
  name: "Name",
  brand: "Brand",
  model: "Model",
  trim: "Trim",
  price_egp: "Price (EGP)",
  year: "Year",
  range_km: "Range (km)",
  transmission: "Transmission",
  drivetrain: "Drivetrain notes",
  body: "Body",
  origin: "Origin",
  feature: "Feature row",
  specs: "Spec sheet (kept)",
  unmapped: "Empty (dropped)",
};

export default function ImportWizard({
  existingVehicles,
}: {
  existingVehicles: ExistingVehicle[];
}) {
  const [step, setStep] = useState<
    "source" | "mapping" | "autohome-diff" | "result"
  >("source");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Source step
  const [sourceKind, setSourceKind] = useState<"file" | "url" | "autohome">(
    "file",
  );
  const [url, setUrl] = useState("");
  const [autohomeUrl, setAutohomeUrl] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Autohome diff step — multiple scraped vehicles, one decision per.
  const [scrapes, setScrapes] = useState<AutohomeScrape[] | null>(null);
  const [ahDecisions, setAhDecisions] = useState<Record<number, AutohomeDecision>>(
    {},
  );
  const [autohomeResult, setAutohomeResult] = useState<ApplyAutohomeResult | null>(
    null,
  );

  // Preview / mapping step
  const [preview, setPreview] = useState<{
    variantColumns: VariantColumn[];
    specRows: SpecRow[];
  } | null>(null);
  const [decisions, setDecisions] = useState<Record<number, VariantDecision>>({});

  // Result step
  const [result, setResult] = useState<ApplyResult | null>(null);

  const submitSource = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("source", sourceKind);
    startTransition(async () => {
      const r: PreviewResult = await previewImport(formData);
      if ("error" in r) {
        setError(r.error);
        return;
      }
      setPreview({ variantColumns: r.variantColumns, specRows: r.specRows });
      // Default every column to "skip"; admin opts each variant in.
      const initial: Record<number, VariantDecision> = {};
      for (const v of r.variantColumns) initial[v.index] = { kind: "skip" };
      setDecisions(initial);
      setStep("mapping");
    });
  };

  const setDecision = (idx: number, next: VariantDecision) =>
    setDecisions((d) => ({ ...d, [idx]: next }));

  const setRowMapping = (rowIndex: number, mappedTo: SpecMappedTo) =>
    setPreview((p) =>
      p
        ? {
            ...p,
            specRows: p.specRows.map((r) =>
              r.rowIndex === rowIndex ? { ...r, mappedTo } : r,
            ),
          }
        : p,
    );

  const apply = () => {
    if (!preview) return;
    setError(null);
    const payload: ApplyPayload = {
      variantColumns: preview.variantColumns,
      specRows: preview.specRows,
      decisions,
    };
    startTransition(async () => {
      const r = await applyImport(payload);
      setResult(r);
      setStep("result");
    });
  };

  const reset = () => {
    setStep("source");
    setPreview(null);
    setResult(null);
    setUrl("");
    setAutohomeUrl("");
    setScrapes(null);
    setAhDecisions({});
    setAutohomeResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submitAutohome = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const r: PreviewAutohomeResult = await previewAutohomeImport(autohomeUrl);
      if ("error" in r) {
        setError(r.error);
        return;
      }
      setScrapes(r.specs);
      // Default each scraped vehicle to "create" with every non-empty
      // field ticked. Admin can switch any to skip or update existing.
      const initial: Record<number, AutohomeDecision> = {};
      r.specs.forEach((spec, i) => {
        const accepted: string[] = [];
        for (const f of AUTOHOME_DIFF_FIELDS) {
          if (formatAutohomeField(f.key, spec)) accepted.push(f.key);
        }
        initial[i] = {
          kind: "create",
          slug: spec.name ? slugify(spec.name) : "",
          origin: "cn",
          type: "ev",
          acceptedFields: accepted,
        };
      });
      setAhDecisions(initial);
      setStep("autohome-diff");
    });
  };

  const setAhDecision = (i: number, next: AutohomeDecision) =>
    setAhDecisions((d) => ({ ...d, [i]: next }));

  const toggleAhField = (i: number, key: string) =>
    setAhDecisions((d) => {
      const cur = d[i];
      if (!cur || cur.kind === "skip") return d;
      const accepted = new Set(cur.acceptedFields);
      if (accepted.has(key)) accepted.delete(key);
      else accepted.add(key);
      return { ...d, [i]: { ...cur, acceptedFields: Array.from(accepted) } };
    });

  const applyAutohome = () => {
    if (!scrapes) return;
    setError(null);
    const payload: ApplyAutohomePayload = { scrapes, decisions: ahDecisions };
    startTransition(async () => {
      const r = await applyAutohomeScrape(payload);
      setAutohomeResult(r);
      setStep("result");
    });
  };

  // ─── Source step ─────────────────────────────────────────────────────
  if (step === "source") {
    // Autohome flow is its own form (different submit handler + no
    // CSV/sheet plumbing). When the radio is on "autohome" we render
    // a separate form below instead of trying to share the CSV form.
    if (sourceKind === "autohome") {
      return (
        <form onSubmit={submitAutohome} className="imp__card">
          <div className="imp__source-toggle">
            <label className={`imp__radio${(sourceKind as string) === "file" ? " is-on" : ""}`}>
              <input
                type="radio"
                name="kind"
                checked={(sourceKind as string) === "file"}
                onChange={() => setSourceKind("file")}
              />
              CSV file
            </label>
            <label className={`imp__radio${(sourceKind as string) === "url" ? " is-on" : ""}`}>
              <input
                type="radio"
                name="kind"
                checked={(sourceKind as string) === "url"}
                onChange={() => setSourceKind("url")}
              />
              Google Sheets URL
            </label>
            <label className={`imp__radio${sourceKind === "autohome" ? " is-on" : ""}`}>
              <input
                type="radio"
                name="kind"
                checked={sourceKind === "autohome"}
                onChange={() => setSourceKind("autohome")}
              />
              Autohome URL
            </label>
          </div>

          <div className="adm__field">
            <label className="adm__label" htmlFor="autohome-url">
              Autohome spec page URL
            </label>
            <input
              id="autohome-url"
              type="url"
              required
              className="adm__input"
              placeholder="https://www.autohome.com.cn/spec/71023/"
              value={autohomeUrl}
              onChange={(e) => setAutohomeUrl(e.target.value)}
            />
            <p className="adm__sub" style={{ marginTop: ".4rem", fontSize: ".8rem" }}>
              Paste a single spec page (
              <code>autohome.com.cn/spec/&lt;id&gt;/</code>) or a comparison
              page (<code>car.autohome.com.cn/duibi/chexing/#carids=…</code>).
              Each scraped vehicle gets its own create / update / skip choice
              and per-field opt-in.
            </p>
          </div>

          {error && (
            <div className="adm__error" style={{ whiteSpace: "pre-line" }}>
              {error}
            </div>
          )}

          <div className="adm__form-actions">
            <button type="submit" className="adm__btn adm__btn--primary" disabled={pending}>
              {pending ? "Scraping…" : "Fetch and preview"}
            </button>
            <Link href="/admin/vehicles" className="adm__btn adm__btn--ghost">
              Cancel
            </Link>
          </div>
        </form>
      );
    }

    return (
      <form
        onSubmit={submitSource}
        className="imp__card"
      >
        <div className="imp__source-toggle">
          <label className={`imp__radio${sourceKind === "file" ? " is-on" : ""}`}>
            <input
              type="radio"
              name="kind"
              checked={sourceKind === "file"}
              onChange={() => setSourceKind("file")}
            />
            CSV file
          </label>
          <label className={`imp__radio${sourceKind === "url" ? " is-on" : ""}`}>
            <input
              type="radio"
              name="kind"
              checked={sourceKind === "url"}
              onChange={() => setSourceKind("url")}
            />
            Google Sheets URL
          </label>
          <label className={`imp__radio${(sourceKind as string) === "autohome" ? " is-on" : ""}`}>
            <input
              type="radio"
              name="kind"
              checked={(sourceKind as string) === "autohome"}
              onChange={() => setSourceKind("autohome")}
            />
            Autohome URL
          </label>
        </div>

        {sourceKind === "file" ? (
          <div className="adm__field">
            <label className="adm__label" htmlFor="file">
              CSV file (max 2 MB)
            </label>
            <input
              ref={fileRef}
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
              className="adm__input"
            />
          </div>
        ) : (
          <div className="adm__field">
            <label className="adm__label" htmlFor="url">
              Sheets share URL
            </label>
            <input
              id="url"
              name="url"
              type="url"
              required
              className="adm__input"
              placeholder="https://docs.google.com/spreadsheets/d/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="adm__sub" style={{ marginTop: ".4rem", fontSize: ".8rem" }}>
              Set sharing to &ldquo;Anyone with the link can view&rdquo; — the
              worker fetches it server-side, no Google login.
            </p>
          </div>
        )}

        {error && <div className="adm__error">{error}</div>}

        <div className="adm__form-actions">
          <button type="submit" className="adm__btn adm__btn--primary" disabled={pending}>
            {pending ? "Parsing…" : "Parse and preview"}
          </button>
          <Link href="/admin/vehicles" className="adm__btn adm__btn--ghost">
            Cancel
          </Link>
        </div>
      </form>
    );
  }

  // ─── Mapping step ────────────────────────────────────────────────────
  if (step === "mapping" && preview) {
    const featureRowCount = preview.specRows.filter(
      (r) => r.mappedTo === "feature",
    ).length;
    const specsRowCount = preview.specRows.filter(
      (r) => r.mappedTo === "specs",
    ).length;
    const unmappedCount = preview.specRows.filter(
      (r) => r.mappedTo === "unmapped",
    ).length;
    const mappedCount =
      preview.specRows.length - featureRowCount - specsRowCount - unmappedCount;

    return (
      <>
        <div className="imp__summary">
          <span>{preview.variantColumns.length} variant columns</span>
          <span>{mappedCount} mapped to fields</span>
          <span>{featureRowCount} feature rows</span>
          <span>{specsRowCount} spec-sheet rows</span>
          {unmappedCount > 0 && (
            <span className="imp__summary--warn">{unmappedCount} empty (dropped)</span>
          )}
        </div>

        <div className="imp__variants">
          {preview.variantColumns.map((variant) => {
            const decision = decisions[variant.index] ?? { kind: "skip" };
            return (
              <div key={variant.index} className="imp__variant">
                <div className="imp__variant-head">
                  <strong>{variant.headerLabel}</strong>
                  {variant.derivedYear && (
                    <span className="adm__pill adm__pill--off">
                      {variant.derivedYear}
                    </span>
                  )}
                </div>

                <div className="imp__variant-actions">
                  <label className="imp__radio">
                    <input
                      type="radio"
                      checked={decision.kind === "skip"}
                      onChange={() => setDecision(variant.index, { kind: "skip" })}
                    />
                    Skip
                  </label>
                  <label className="imp__radio">
                    <input
                      type="radio"
                      checked={decision.kind === "create"}
                      onChange={() =>
                        setDecision(variant.index, {
                          kind: "create",
                          slug: variant.suggestedSlug,
                          origin: "cn",
                          type: "ev",
                          brand: null,
                          trim: variant.derivedTrim,
                        })
                      }
                    />
                    Create new
                  </label>
                  <label className="imp__radio">
                    <input
                      type="radio"
                      checked={decision.kind === "update"}
                      onChange={() =>
                        setDecision(variant.index, {
                          kind: "update",
                          vehicleId: existingVehicles[0]?.id ?? "",
                          trim: variant.derivedTrim,
                        })
                      }
                      disabled={existingVehicles.length === 0}
                    />
                    Update existing
                  </label>
                </div>

                {decision.kind === "create" && (
                  <div className="imp__variant-fields">
                    <Field label="Slug">
                      <input
                        className="adm__input"
                        value={decision.slug}
                        onChange={(e) =>
                          setDecision(variant.index, {
                            ...decision,
                            slug: slugify(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label="Trim">
                      <input
                        className="adm__input"
                        value={decision.trim ?? ""}
                        onChange={(e) =>
                          setDecision(variant.index, {
                            ...decision,
                            trim: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Brand">
                      <input
                        className="adm__input"
                        value={decision.brand ?? ""}
                        onChange={(e) =>
                          setDecision(variant.index, {
                            ...decision,
                            brand: e.target.value || null,
                          })
                        }
                      />
                    </Field>
                    <Field label="Origin">
                      <select
                        className="adm__select"
                        value={decision.origin}
                        onChange={(e) =>
                          setDecision(variant.index, {
                            ...decision,
                            origin: e.target.value as "cn" | "ae",
                          })
                        }
                      >
                        <option value="cn">China</option>
                        <option value="ae">UAE</option>
                      </select>
                    </Field>
                    <Field label="Power train">
                      <select
                        className="adm__select"
                        value={decision.type}
                        onChange={(e) =>
                          setDecision(variant.index, {
                            ...decision,
                            type: e.target.value as
                              | "ev"
                              | "reev"
                              | "phev"
                              | "hybrid",
                          })
                        }
                      >
                        <option value="ev">EV</option>
                        <option value="reev">REEV</option>
                        <option value="phev">PHEV</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </Field>
                  </div>
                )}

                {decision.kind === "update" && (
                  <div className="imp__variant-fields">
                    <Field label="Vehicle to overwrite">
                      <select
                        className="adm__select"
                        value={decision.vehicleId}
                        onChange={(e) =>
                          setDecision(variant.index, {
                            ...decision,
                            vehicleId: e.target.value,
                          })
                        }
                      >
                        {existingVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.slug})
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Trim">
                      <input
                        className="adm__input"
                        value={decision.trim ?? ""}
                        onChange={(e) =>
                          setDecision(variant.index, {
                            ...decision,
                            trim: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <details className="imp__rows-detail">
          <summary>
            Show all {preview.specRows.length} parsed spec rows · click any
            mapping to override
          </summary>
          <table className="adm__table" style={{ marginTop: "1rem" }}>
            <thead>
              <tr>
                <th>Row label</th>
                <th>Mapped to</th>
                <th>Section</th>
              </tr>
            </thead>
            <tbody>
              {preview.specRows.map((r) => (
                <tr key={r.rowIndex}>
                  <td>{r.label}</td>
                  <td>
                    <select
                      value={r.mappedTo}
                      onChange={(e) =>
                        setRowMapping(r.rowIndex, e.target.value as SpecMappedTo)
                      }
                      className="adm__select"
                      style={{ padding: ".35rem .5rem", fontSize: ".82rem" }}
                    >
                      {(Object.keys(SPEC_LABELS) as SpecMappedTo[])
                        .filter((k) => k !== "unmapped")
                        .map((k) => (
                          <option key={k} value={k}>
                            {SPEC_LABELS[k]}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td>{r.section ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>

        {error && <div className="adm__error">{error}</div>}

        <div className="adm__form-actions">
          <button
            type="button"
            className="adm__btn adm__btn--primary"
            onClick={apply}
            disabled={pending}
          >
            {pending ? "Importing…" : "Apply import"}
          </button>
          <button
            type="button"
            className="adm__btn adm__btn--ghost"
            onClick={reset}
          >
            ← Start over
          </button>
        </div>
      </>
    );
  }

  // ─── Autohome diff step ─────────────────────────────────────────────
  if (step === "autohome-diff" && scrapes) {
    const actionable = Object.values(ahDecisions).filter(
      (d) => d.kind !== "skip",
    ).length;
    return (
      <>
        <div className="imp__summary">
          <span>{scrapes.length} scraped vehicle{scrapes.length === 1 ? "" : "s"}</span>
          <span>{actionable} to create or update</span>
        </div>

        <div className="imp__variants">
          {scrapes.map((scrape, i) => {
            const decision = ahDecisions[i] ?? { kind: "skip" };
            const visible = AUTOHOME_DIFF_FIELDS.filter((f) =>
              formatAutohomeField(f.key, scrape),
            );
            const acceptedFields =
              decision.kind === "skip" ? [] : decision.acceptedFields;
            const acceptedSet = new Set(acceptedFields);
            return (
              <div key={i} className="imp__variant">
                <div className="imp__variant-head">
                  <div>
                    <strong>{scrape.name ?? scrape.page_title ?? `Vehicle #${i + 1}`}</strong>
                    <div className="adm__sub" style={{ fontSize: ".78rem" }}>
                      <a href={scrape.source_url} target="_blank" rel="noopener noreferrer">
                        {scrape.source_url}
                      </a>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: ".5rem" }}>
                  <label className={`imp__radio${decision.kind === "skip" ? " is-on" : ""}`}>
                    <input
                      type="radio"
                      name={`ah-decision-${i}`}
                      checked={decision.kind === "skip"}
                      onChange={() => setAhDecision(i, { kind: "skip" })}
                    />
                    Skip
                  </label>
                  <label className={`imp__radio${decision.kind === "create" ? " is-on" : ""}`}>
                    <input
                      type="radio"
                      name={`ah-decision-${i}`}
                      checked={decision.kind === "create"}
                      onChange={() =>
                        setAhDecision(i, {
                          kind: "create",
                          slug: scrape.name ? slugify(scrape.name) : "",
                          origin: "cn",
                          type: "ev",
                          acceptedFields: visible
                            .map((f) => f.key)
                            .filter((k) => formatAutohomeField(k, scrape)),
                        })
                      }
                    />
                    Create new
                  </label>
                  <label className={`imp__radio${decision.kind === "update" ? " is-on" : ""}`}>
                    <input
                      type="radio"
                      name={`ah-decision-${i}`}
                      checked={decision.kind === "update"}
                      onChange={() =>
                        setAhDecision(i, {
                          kind: "update",
                          vehicleId: existingVehicles[0]?.id ?? "",
                          acceptedFields: visible
                            .map((f) => f.key)
                            .filter((k) => formatAutohomeField(k, scrape)),
                        })
                      }
                    />
                    Update existing
                  </label>
                </div>

                {decision.kind === "create" && (
                  <div style={{ display: "flex", gap: "1rem", marginTop: ".75rem", flexWrap: "wrap" }}>
                    <div style={{ flex: "2 1 18rem" }}>
                      <label className="adm__label" htmlFor={`ah-slug-${i}`}>
                        Slug
                      </label>
                      <input
                        id={`ah-slug-${i}`}
                        type="text"
                        className="adm__input"
                        value={decision.slug}
                        onChange={(e) =>
                          setAhDecision(i, { ...decision, slug: e.target.value })
                        }
                        placeholder="avatr-06-ultra-ev"
                      />
                    </div>
                    <div style={{ flex: "1 1 8rem" }}>
                      <label className="adm__label" htmlFor={`ah-origin-${i}`}>
                        Origin
                      </label>
                      <select
                        id={`ah-origin-${i}`}
                        className="adm__input"
                        value={decision.origin}
                        onChange={(e) =>
                          setAhDecision(i, {
                            ...decision,
                            origin: e.target.value as "cn" | "ae",
                          })
                        }
                      >
                        <option value="cn">China</option>
                        <option value="ae">UAE</option>
                      </select>
                    </div>
                    <div style={{ flex: "1 1 8rem" }}>
                      <label className="adm__label" htmlFor={`ah-type-${i}`}>
                        Powertrain
                      </label>
                      <select
                        id={`ah-type-${i}`}
                        className="adm__input"
                        value={decision.type}
                        onChange={(e) =>
                          setAhDecision(i, {
                            ...decision,
                            type: e.target.value as
                              | "ev"
                              | "reev"
                              | "phev"
                              | "hybrid",
                          })
                        }
                      >
                        <option value="ev">Pure EV</option>
                        <option value="reev">REEV</option>
                        <option value="phev">PHEV</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>
                )}

                {decision.kind === "update" && (
                  <div className="adm__field" style={{ marginTop: ".75rem" }}>
                    <label className="adm__label" htmlFor={`ah-target-${i}`}>
                      Vehicle to update
                    </label>
                    <select
                      id={`ah-target-${i}`}
                      className="adm__input"
                      value={decision.vehicleId}
                      onChange={(e) =>
                        setAhDecision(i, {
                          ...decision,
                          vehicleId: e.target.value,
                        })
                      }
                    >
                      <option value="">— pick a vehicle —</option>
                      {existingVehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.slug})
                        </option>
                      ))}
                    </select>
                    <p className="adm__sub" style={{ fontSize: ".78rem", marginTop: ".25rem" }}>
                      Ticked fields below will overwrite the matching columns
                      on this vehicle. Unticked fields stay as they are.
                    </p>
                  </div>
                )}

                {decision.kind !== "skip" && (
                  <table className="adm__table" style={{ marginTop: ".75rem" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "30%" }}>Field</th>
                        <th>Scraped value</th>
                        <th style={{ width: "70px", textAlign: "center" }}>Apply</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((f) => (
                        <tr key={f.key}>
                          <td>{f.label}</td>
                          <td>
                            <span style={{ fontFamily: "var(--ff-mono)", fontSize: ".85rem" }}>
                              {formatAutohomeField(f.key, scrape)}
                            </span>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={acceptedSet.has(f.key)}
                              onChange={() => toggleAhField(i, f.key)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>

        {error && <div className="adm__error">{error}</div>}

        <div className="adm__form-actions">
          <button
            type="button"
            className="adm__btn adm__btn--primary"
            onClick={applyAutohome}
            disabled={pending || actionable === 0}
          >
            {pending
              ? "Applying…"
              : `Apply (${actionable} vehicle${actionable === 1 ? "" : "s"})`}
          </button>
          <button
            type="button"
            className="adm__btn adm__btn--ghost"
            onClick={reset}
          >
            ← Start over
          </button>
        </div>
      </>
    );
  }

  // ─── Result step (autohome flow) ────────────────────────────────────
  if (step === "result" && autohomeResult) {
    if ("error" in autohomeResult) {
      return (
        <>
          <div className="adm__error">{autohomeResult.error}</div>
          <div className="adm__form-actions">
            <button type="button" className="adm__btn adm__btn--ghost" onClick={reset}>
              ← Start over
            </button>
          </div>
        </>
      );
    }
    return (
      <>
        <p className="adm__sub">
          Done. {autohomeResult.results.length} vehicle
          {autohomeResult.results.length === 1 ? "" : "s"} processed.
        </p>
        <table className="adm__table">
          <thead>
            <tr>
              <th>Scrape</th>
              <th>Slug</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {autohomeResult.results.map((r, idx) => (
              <tr key={idx}>
                <td>#{r.index + 1}</td>
                <td>{r.slug || "—"}</td>
                <td>{r.status}</td>
                <td>
                  {r.vehicleId && (
                    <Link
                      href={`/admin/vehicles/${r.vehicleId}/edit`}
                      className="adm__btn adm__btn--ghost"
                      style={{ padding: ".25rem .6rem", fontSize: ".82rem" }}
                    >
                      Edit →
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="adm__form-actions">
          <button type="button" className="adm__btn adm__btn--ghost" onClick={reset}>
            Import another
          </button>
        </div>
      </>
    );
  }

  // ─── Result step (CSV/Sheet flow) ───────────────────────────────────
  if (step === "result" && result) {
    if ("error" in result) {
      return (
        <>
          <div className="adm__error">{result.error}</div>
          <div className="adm__form-actions">
            <button
              type="button"
              className="adm__btn adm__btn--ghost"
              onClick={reset}
            >
              ← Start over
            </button>
          </div>
        </>
      );
    }
    return (
      <>
        <p className="adm__sub">
          Done. {result.results.length} variants processed.
        </p>
        <table className="adm__table">
          <thead>
            <tr>
              <th>Variant column</th>
              <th>Slug</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {result.results.map((r, i) => (
              <tr key={i}>
                <td>#{r.columnIndex}</td>
                <td>{r.slug || "—"}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="adm__form-actions">
          <Link href="/admin/vehicles" className="adm__btn adm__btn--primary">
            Back to vehicles
          </Link>
          <button
            type="button"
            className="adm__btn adm__btn--ghost"
            onClick={reset}
          >
            Import another
          </button>
        </div>
      </>
    );
  }

  return null;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="adm__field">
      <span className="adm__label">{label}</span>
      {children}
    </label>
  );
}
