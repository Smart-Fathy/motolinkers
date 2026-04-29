"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { slugify } from "@/lib/utils";
import {
  applyImport,
  previewImport,
  type ApplyPayload,
  type ApplyResult,
  type PreviewResult,
  type SpecMappedTo,
  type SpecRow,
  type VariantColumn,
  type VariantDecision,
} from "./import-actions";

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
  const [step, setStep] = useState<"source" | "mapping" | "result">("source");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Source step
  const [sourceKind, setSourceKind] = useState<"file" | "url">("file");
  const [url, setUrl] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

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
    if (fileRef.current) fileRef.current.value = "";
  };

  // ─── Source step ─────────────────────────────────────────────────────
  if (step === "source") {
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

  // ─── Result step ─────────────────────────────────────────────────────
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
