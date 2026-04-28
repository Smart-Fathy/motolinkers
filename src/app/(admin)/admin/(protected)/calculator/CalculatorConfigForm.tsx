"use client";

import { useState, useTransition } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { updateCalculatorConfig } from "./actions";

type Config = Database["public"]["Tables"]["calculator_config"]["Row"];

const FIELDS: {
  name: keyof Config;
  label: string;
  step: string;
}[] = [
  { name: "egp_rate", label: "EGP / USD rate", step: "0.01" },
  { name: "freight_cn", label: "Freight — China (USD)", step: "1" },
  { name: "freight_ae", label: "Freight — UAE (USD)", step: "1" },
  { name: "transit_cn", label: "Transit — China (days)", step: "1" },
  { name: "transit_ae", label: "Transit — UAE (days)", step: "1" },
  { name: "tax_ev", label: "Tax rate — EV", step: "0.01" },
  { name: "tax_reev", label: "Tax rate — REEV", step: "0.01" },
  { name: "tax_phev", label: "Tax rate — PHEV", step: "0.01" },
  { name: "vat", label: "VAT rate", step: "0.01" },
  { name: "insurance_rate", label: "Insurance rate", step: "0.0001" },
  { name: "clearance_usd", label: "Clearance (USD)", step: "1" },
  { name: "inland_delivery_usd", label: "Inland delivery (USD)", step: "1" },
  { name: "consulting_fee_pct", label: "Consulting fee %", step: "0.001" },
  { name: "payment_usd_fee", label: "Payment fee — USD", step: "0.001" },
  { name: "payment_bank_fee", label: "Payment fee — bank", step: "0.001" },
];

export default function CalculatorConfigForm({ config }: { config: Config }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateCalculatorConfig(formData);
      if (result?.error) setError(result.error);
      else setSuccess(true);
    });
  };

  return (
    <form className="adm__form" onSubmit={onSubmit}>
      {FIELDS.map((f) => (
        <div className="adm__field" key={String(f.name)}>
          <label className="adm__label" htmlFor={String(f.name)}>
            {f.label}
          </label>
          <input
            id={String(f.name)}
            name={String(f.name)}
            type="number"
            step={f.step}
            min="0"
            required
            className="adm__input"
            defaultValue={String(config[f.name] ?? "")}
          />
        </div>
      ))}
      {error && <div className="adm__error adm__field--full">{error}</div>}
      {success && (
        <div
          className="adm__field--full"
          style={{
            padding: ".75rem 1rem",
            borderRadius: "10px",
            background: "rgba(201,168,76,.10)",
            border: "1px solid rgba(201,168,76,.3)",
            color: "var(--volt)",
            fontSize: ".9rem",
          }}
        >
          Saved. Public calculator now uses these values.
        </div>
      )}
      <div className="adm__form-actions">
        <button type="submit" className="adm__btn adm__btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
