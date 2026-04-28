import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_CALCULATOR_CONFIG,
  type CalculatorConfig,
} from "@/components/home/Calculator";

export async function getCalculatorConfig(): Promise<CalculatorConfig> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("calculator_config")
      .select(
        "egp_rate, freight_cn, freight_ae, transit_cn, transit_ae, tax_ev, tax_reev, tax_phev, vat, insurance_rate, clearance_usd, inland_delivery_usd, consulting_fee_pct, payment_usd_fee, payment_bank_fee",
      )
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) return DEFAULT_CALCULATOR_CONFIG;

    return {
      egp_rate: Number(data.egp_rate),
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
  } catch {
    return DEFAULT_CALCULATOR_CONFIG;
  }
}
