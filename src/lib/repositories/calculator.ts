import { createPublicClient } from "@/lib/supabase/public";
import {
  DEFAULT_CALCULATOR_CONFIG,
  type CalculatorConfig,
} from "@/components/home/Calculator";

// open.er-api.com is a free, key-less, daily-refreshed FX endpoint.
// We cache the response at the edge for an hour so the calculator
// renders without an extra round-trip on most loads.
const FX_URL = "https://open.er-api.com/v6/latest/USD";
const FX_TTL_SECONDS = 60 * 60;

type ErApiResponse = {
  result?: string;
  rates?: Record<string, number>;
  time_last_update_unix?: number;
};

async function fetchLiveEgpRate(): Promise<{ rate: number; fetchedAt: string } | null> {
  try {
    const res = await fetch(FX_URL, {
      next: { revalidate: FX_TTL_SECONDS },
    });
    if (!res.ok) {
      console.error(`[calculator] FX fetch HTTP ${res.status}`);
      return null;
    }
    const json = (await res.json()) as ErApiResponse;
    if (json.result !== "success") {
      console.error("[calculator] FX response not 'success':", json.result);
      return null;
    }
    const rate = json.rates?.EGP;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      console.error("[calculator] FX response missing EGP rate");
      return null;
    }
    const fetchedAt = json.time_last_update_unix
      ? new Date(json.time_last_update_unix * 1000).toISOString()
      : new Date().toISOString();
    return { rate, fetchedAt };
  } catch (e) {
    console.error("[calculator] FX fetch threw:", e);
    return null;
  }
}

export async function getCalculatorConfig(): Promise<CalculatorConfig> {
  let baseConfig: CalculatorConfig = DEFAULT_CALCULATOR_CONFIG;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("calculator_config")
      .select(
        "egp_rate, freight_cn, freight_ae, transit_cn, transit_ae, tax_ev, tax_reev, tax_phev, vat, insurance_rate, clearance_usd, inland_delivery_usd, consulting_fee_pct, payment_usd_fee, payment_bank_fee",
      )
      .eq("id", 1)
      .maybeSingle();

    if (!error && data) {
      baseConfig = {
        egp_rate: Number(data.egp_rate),
        egp_rate_source: "manual",
        egp_rate_fetched_at: null,
        freight_cn: data.freight_cn,
        freight_ae: data.freight_ae,
        transit_cn: data.transit_cn,
        transit_ae: data.transit_ae,
        tax_ev: Number(data.tax_ev),
        tax_reev: Number(data.tax_reev),
        tax_phev: Number(data.tax_phev),
        vat: Number(data.vat),
        insurance_rate: Number(data.insurance_rate),
        clearance_usd: data.clearance_usd,
        inland_delivery_usd: data.inland_delivery_usd,
        consulting_fee_pct: Number(data.consulting_fee_pct),
        payment_usd_fee: Number(data.payment_usd_fee),
        payment_bank_fee: Number(data.payment_bank_fee),
      };
    }
  } catch (e) {
    console.error("[calculator] supabase config fetch threw:", e);
  }

  const live = await fetchLiveEgpRate();
  if (live) {
    return {
      ...baseConfig,
      egp_rate: live.rate,
      egp_rate_source: "live",
      egp_rate_fetched_at: live.fetchedAt,
    };
  }
  return baseConfig;
}
