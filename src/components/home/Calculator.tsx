"use client";

import { useState } from "react";
import Label from "@/components/ui/Label";
import Reveal from "@/components/ui/Reveal";

type DriveType = "ev" | "reev" | "phev";
type Origin = "cn" | "ae";
type Payment = "usd" | "bank";

export type CalculatorConfig = {
  egp_rate: number;
  freight_cn: number;
  freight_ae: number;
  transit_cn: number;
  transit_ae: number;
  tax_ev: number;
  tax_reev: number;
  tax_phev: number;
  vat: number;
  insurance_rate: number;
  clearance_usd: number;
  inland_delivery_usd: number;
  consulting_fee_pct: number;
  payment_usd_fee: number;
  payment_bank_fee: number;
};

// Schema defaults — mirrors `supabase/schema.sql` calculator_config row, used
// as a fallback if the live config can't be loaded.
export const DEFAULT_CALCULATOR_CONFIG: CalculatorConfig = {
  egp_rate: 51.3,
  freight_cn: 4025,
  freight_ae: 2900,
  transit_cn: 45,
  transit_ae: 28,
  tax_ev: 0.17,
  tax_reev: 0.27,
  tax_phev: 0.58,
  vat: 0.14,
  insurance_rate: 0.015,
  clearance_usd: 1200,
  inland_delivery_usd: 350,
  consulting_fee_pct: 0.04,
  payment_usd_fee: 0.03,
  payment_bank_fee: 0.015,
};

const STEPS = [
  { n: 1, label: "Vehicle" },
  { n: 2, label: "Type" },
  { n: 3, label: "Origin" },
  { n: 4, label: "Payment" },
  { n: 5, label: "Results" },
];

function formatUSD(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US");
}
const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;

interface Result {
  fob: number;
  paymentFeeUSD: number;
  freight: number;
  insurance: number;
  customsDuty: number;
  vat: number;
  clearance: number;
  inlandDelivery: number;
  consultingFee: number;
  totalUSD: number;
  totalEGP: number;
  days: number;
  carName: string;
  origin: Origin;
  paymentFee: number;
  typeRate: number;
}

export default function Calculator({
  config = DEFAULT_CALCULATOR_CONFIG,
}: {
  config?: CalculatorConfig;
}) {
  const typeRates: Record<DriveType, number> = {
    ev: config.tax_ev,
    reev: config.tax_reev,
    phev: config.tax_phev,
  };
  const originFreight: Record<Origin, { freight: number; days: number }> = {
    cn: { freight: config.freight_cn, days: config.transit_cn },
    ae: { freight: config.freight_ae, days: config.transit_ae },
  };
  const paymentFees: Record<Payment, number> = {
    usd: config.payment_usd_fee,
    bank: config.payment_bank_fee,
  };

  const [step, setStep] = useState(1);
  const [carName, setCarName] = useState("BYD Sealion 06 EV 605 PLUS");
  const [fob, setFob] = useState("26500");
  const [type, setType] = useState<DriveType | null>(null);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const goTo = (target: number) => {
    if (target === 2) {
      const f = parseFloat(fob);
      if (!Number.isFinite(f) || f <= 0) {
        document.getElementById("fobPrice")?.focus();
        return;
      }
    }
    if (target === 3 && !type) {
      alert("Pick a drivetrain type.");
      return;
    }
    if (target === 4 && !origin) {
      alert("Pick an origin.");
      return;
    }
    setStep(target);
  };

  const calculate = () => {
    if (!type || !origin || !payment) {
      alert("Pick a payment route.");
      return;
    }
    const f = parseFloat(fob) || 0;
    const fee = paymentFees[payment];
    const rate = typeRates[type];
    const { freight, days } = originFreight[origin];

    const paymentFeeUSD = f * fee;
    const insurance = (f + freight) * config.insurance_rate;
    const cifBase = f + freight + insurance;
    const customsDuty = cifBase * rate;
    const vat = (cifBase + customsDuty) * config.vat;
    const clearance = config.clearance_usd;
    const inlandDelivery = config.inland_delivery_usd;
    const consultingFee = f * config.consulting_fee_pct;
    const totalUSD =
      f +
      paymentFeeUSD +
      freight +
      insurance +
      customsDuty +
      vat +
      clearance +
      inlandDelivery +
      consultingFee;

    setResult({
      fob: f,
      paymentFeeUSD,
      freight,
      insurance,
      customsDuty,
      vat,
      clearance,
      inlandDelivery,
      consultingFee,
      totalUSD,
      totalEGP: totalUSD * config.egp_rate,
      days,
      carName: carName.trim() || "Your vehicle",
      origin,
      paymentFee: fee,
      typeRate: rate,
    });
    setStep(5);
  };

  const reset = () => {
    setType(null);
    setOrigin(null);
    setPayment(null);
    setResult(null);
    setStep(1);
  };

  const stepClass = (n: number) =>
    `step-pill${step === n ? " is-active" : n < step ? " is-done" : ""}`;

  return (
    <section className="calc" id="calculator">
      <div className="calc__bg" aria-hidden="true" />
      <div className="wrap">
        <div className="calc__head">
          <div>
            <Label>Landed-cost calculator</Label>
            <Reveal as="h2" className="calc__title">
              Every pound, <em>accounted for.</em>
            </Reveal>
          </div>
          <Reveal as="p" className="calc__sub">
            Four inputs. Full breakdown. The same math our consultants run on a
            Monday morning — taxes, freight, insurance, clearance, and exchange
            margin all exposed.
          </Reveal>
        </div>

        <div className="calc__shell">
          <div className="steps" id="calcSteps" role="tablist">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className={stepClass(s.n)}
                data-step={s.n}
                onClick={() => {
                  if (s.n <= step || s.n < step) setStep(s.n);
                }}
              >
                <span className="n">{s.n}</span>
                {s.label}
              </div>
            ))}
          </div>

          {/* STEP 1 */}
          <div className={`step-panel${step === 1 ? " is-active" : ""}`}>
            <h3>Tell us about the vehicle.</h3>
            <p className="hint">
              Start with the model and the factory (FOB) price in US dollars.
              You&apos;ll find both on our Fleet page or on autohome.com.cn.
            </p>
            <div className="field">
              <label htmlFor="carName">Vehicle Name</label>
              <input
                id="carName"
                type="text"
                placeholder="e.g. BYD Sealion 06 EV 605 PLUS"
                value={carName}
                onChange={(e) => setCarName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="fobPrice">FOB Price (USD)</label>
              <input
                id="fobPrice"
                type="number"
                placeholder="e.g. 26500"
                value={fob}
                onChange={(e) => setFob(e.target.value)}
              />
            </div>
            <div className="calc__actions">
              <span />
              <button
                className="btn btn--primary"
                data-hover
                onClick={() => goTo(2)}
              >
                Continue
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* STEP 2 */}
          <div className={`step-panel${step === 2 ? " is-active" : ""}`}>
            <h3>What kind of drivetrain?</h3>
            <p className="hint">
              The Egyptian tariff structure rewards electrification. Pure EVs
              are taxed at {pct(config.tax_ev)}, hybrids significantly higher.
            </p>
            <div className="choices">
              {(
                [
                  { v: "ev", icon: "⚡", title: "Pure Electric (EV)", rate: pct(config.tax_ev) },
                  { v: "reev", icon: "🔋", title: "Range Extended (REEV)", rate: pct(config.tax_reev) },
                  { v: "phev", icon: "🔌", title: "Plug-in Hybrid (PHEV)", rate: pct(config.tax_phev) },
                ] as const
              ).map((c) => (
                <button
                  key={c.v}
                  className={`choice${type === c.v ? " is-selected" : ""}`}
                  data-hover
                  onClick={() => setType(c.v)}
                >
                  <span className="choice__icon">{c.icon}</span>
                  <span className="choice__title">{c.title}</span>
                  <span className="choice__meta">
                    Tariff <strong>{c.rate}</strong>
                  </span>
                </button>
              ))}
            </div>
            <div className="calc__actions">
              <button
                className="btn btn--ghost"
                data-hover
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button
                className="btn btn--primary"
                data-hover
                onClick={() => goTo(3)}
              >
                Continue
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* STEP 3 */}
          <div className={`step-panel${step === 3 ? " is-active" : ""}`}>
            <h3>Where is it shipping from?</h3>
            <p className="hint">
              Two proven lanes into Alexandria. China gives you selection; UAE
              gives you speed.
            </p>
            <div className="choices">
              <button
                className={`choice${origin === "cn" ? " is-selected" : ""}`}
                data-hover
                onClick={() => setOrigin("cn")}
              >
                <span className="choice__icon">🇨🇳</span>
                <span className="choice__title">China</span>
                <span className="choice__meta">
                  Nansha → Alexandria · <strong>{formatUSD(config.freight_cn)}</strong> · {config.transit_cn} days
                </span>
              </button>
              <button
                className={`choice${origin === "ae" ? " is-selected" : ""}`}
                data-hover
                onClick={() => setOrigin("ae")}
              >
                <span className="choice__icon">🇦🇪</span>
                <span className="choice__title">United Arab Emirates</span>
                <span className="choice__meta">
                  Jebel Ali → Alexandria · <strong>{formatUSD(config.freight_ae)}</strong> · {config.transit_ae} days
                </span>
              </button>
            </div>
            <div className="calc__actions">
              <button
                className="btn btn--ghost"
                data-hover
                onClick={() => setStep(2)}
              >
                ← Back
              </button>
              <button
                className="btn btn--primary"
                data-hover
                onClick={() => goTo(4)}
              >
                Continue
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* STEP 4 */}
          <div className={`step-panel${step === 4 ? " is-active" : ""}`}>
            <h3>How will payment be routed?</h3>
            <p className="hint">
              Bank-to-bank routes are cheaper on the FX spread; direct USD
              transfers are faster.
            </p>
            <div className="choices">
              <button
                className={`choice${payment === "usd" ? " is-selected" : ""}`}
                data-hover
                onClick={() => setPayment("usd")}
              >
                <span className="choice__icon">💵</span>
                <span className="choice__title">USD Transfer</span>
                <span className="choice__meta">
                  Margin <strong>+{pct(config.payment_usd_fee, 1)}</strong> on FOB
                </span>
              </button>
              <button
                className={`choice${payment === "bank" ? " is-selected" : ""}`}
                data-hover
                onClick={() => setPayment("bank")}
              >
                <span className="choice__icon">🏦</span>
                <span className="choice__title">Bank Transfer</span>
                <span className="choice__meta">
                  Margin <strong>+{pct(config.payment_bank_fee, 1)}</strong> on FOB
                </span>
              </button>
            </div>
            <div className="calc__actions">
              <button
                className="btn btn--ghost"
                data-hover
                onClick={() => setStep(3)}
              >
                ← Back
              </button>
              <button
                className="btn btn--primary"
                data-hover
                onClick={calculate}
              >
                Calculate 🧮
              </button>
            </div>
          </div>

          {/* STEP 5 */}
          <div className={`step-panel${step === 5 ? " is-active" : ""}`}>
            <h3>Your true landed cost.</h3>
            <p className="hint">
              All figures in USD unless noted. EGP conversion uses a live-rate
              caveat of ≈ {config.egp_rate.toFixed(2)} EGP / USD — refresh on the day of transfer.
            </p>

            <div className="results">
              <div className="results__total">
                <div>
                  <div className="results__total-label">Total Landed Cost</div>
                  <div className="results__total-value">
                    {result ? formatUSD(result.totalUSD) : "$0"}
                  </div>
                  <div className="results__total-sub">
                    {result
                      ? `${result.carName} · ex ${
                          result.origin === "cn" ? "Nansha" : "Jebel Ali"
                        }`
                      : "Delivered, Cairo"}
                  </div>
                </div>
                <div className="results__total-conversion">
                  ≈{" "}
                  <span>
                    {result
                      ? Math.round(result.totalEGP).toLocaleString()
                      : "0"}
                  </span>{" "}
                  EGP
                  <div
                    style={{
                      opacity: 0.7,
                      marginTop: ".3rem",
                      fontSize: ".72rem",
                    }}
                  >
                    Transit time:{" "}
                    <strong>{result ? `${result.days} days` : "0 days"}</strong>
                  </div>
                </div>
              </div>

              <div className="breakdown">
                {result && (
                  <>
                    <Row l="FOB Factory Price" v={formatUSD(result.fob)} />
                    <Row
                      l={`Payment Route (+${(result.paymentFee * 100).toFixed(1)}%)`}
                      v={formatUSD(result.paymentFeeUSD)}
                    />
                    <Row l="Ocean Freight" v={formatUSD(result.freight)} />
                    <Row
                      l={`Marine Insurance (~${pct(config.insurance_rate, 1)})`}
                      v={formatUSD(result.insurance)}
                    />
                    <Row
                      l={`Customs Duty (${(result.typeRate * 100).toFixed(0)}%)`}
                      v={formatUSD(result.customsDuty)}
                    />
                    <Row l={`VAT (${pct(config.vat)})`} v={formatUSD(result.vat)} />
                    <Row
                      l="Clearance & ACI / Nafeza"
                      v={formatUSD(result.clearance)}
                    />
                    <Row
                      l="Inland Delivery"
                      v={formatUSD(result.inlandDelivery)}
                    />
                    <Row
                      l={`MotoLinkers Fee (${pct(config.consulting_fee_pct)})`}
                      v={formatUSD(result.consultingFee)}
                    />
                    <Row
                      l="Total landed, delivered"
                      v={formatUSD(result.totalUSD)}
                      total
                    />
                  </>
                )}
              </div>
            </div>

            <div className="calc__actions">
              <button
                className="btn btn--ghost"
                data-hover
                onClick={() => setStep(4)}
              >
                ← Adjust
              </button>
              <button className="btn btn--primary" data-hover onClick={reset}>
                Start Over
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({ l, v, total = false }: { l: string; v: string; total?: boolean }) {
  return (
    <div className={`breakdown__row${total ? " total" : ""}`}>
      <span className="l">{l}</span>
      <span className="v">{v}</span>
    </div>
  );
}
