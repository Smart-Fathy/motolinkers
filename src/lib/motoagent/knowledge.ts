// Builds the MotoAgent system prompt from the live CMS + vehicles +
// calculator config. The output is a single string injected as the
// `system` message on every chat turn. We cache it for 5 minutes so a
// busy hour of conversations doesn't hammer Supabase per turn.
//
// Output shape: a markdown digest with sections. Llama models have no
// trouble with markdown; the structure is for our own readability
// when debugging the prompt.

import { getAllNews } from "@/lib/repositories/news";
import { getAllVehicles } from "@/lib/repositories/vehicles";
import { getCalculatorConfig } from "@/lib/repositories/calculator";
import { getPageSections, type PageSlug } from "@/lib/repositories/pages";

const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { value: string; expiresAt: number } | null = null;

const PAGES_TO_INDEX: PageSlug[] = [
  "home",
  "about",
  "how-it-works",
  "faq",
  "calculator",
  "contact",
  "privacy",
  "terms",
];

export interface MotoagentSettings {
  is_enabled: boolean;
  model: string;
  temperature: number;
  max_output_tokens: number;
  system_prompt_extra: string;
  greeting_en: string;
  greeting_ar: string;
  daily_message_cap_per_session: number;
  per_minute_cap_per_session: number;
}

export async function getKnowledgeDigest(force = false): Promise<string> {
  const now = Date.now();
  if (!force && cached && cached.expiresAt > now) {
    return cached.value;
  }
  const value = await buildDigest();
  cached = { value, expiresAt: now + CACHE_TTL_MS };
  return value;
}

async function buildDigest(): Promise<string> {
  const [vehicles, news, calc, ...pages] = await Promise.all([
    getAllVehicles(),
    getAllNews(),
    getCalculatorConfig(),
    ...PAGES_TO_INDEX.map((slug) =>
      getPageSections(slug).then((sections) => ({ slug, sections })),
    ),
  ]);

  const lines: string[] = [];

  // Vehicles — short reference table. Skip galleries, features, specs:
  // those add tokens and the agent rarely needs them. For deeper
  // questions the user can be pointed at the vehicle detail page.
  lines.push("# MotoLinkers — knowledge base\n");
  lines.push("## Vehicles available for import");
  if (vehicles.length === 0) {
    lines.push("(no vehicles published right now)");
  } else {
    lines.push("| Name | Brand | Origin | Type | Year | Range (km) | Price (EGP) | Slug |");
    lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const v of vehicles) {
      const range = v.rangeKm != null ? String(v.rangeKm) : "—";
      lines.push(
        `| ${v.name} | ${v.brand ?? "—"} | ${v.origin === "cn" ? "China" : "UAE"} | ${v.powerTrain ?? v.type} | ${v.year} | ${range} | ${v.price.toLocaleString()} | ${v.id} |`,
      );
    }
  }
  lines.push("");

  // Calculator config — just the rates.
  lines.push("## Landed-cost calculator parameters");
  lines.push(`- EGP / USD rate: ${calc.egp_rate.toFixed(2)} (${calc.egp_rate_source})`);
  lines.push(`- Customs duty — pure EV: ${(calc.tax_ev * 100).toFixed(0)}%`);
  lines.push(`- Customs duty — REEV: ${(calc.tax_reev * 100).toFixed(0)}%`);
  lines.push(`- Customs duty — PHEV: ${(calc.tax_phev * 100).toFixed(0)}%`);
  lines.push(`- VAT: ${(calc.vat * 100).toFixed(0)}%`);
  lines.push(`- Insurance rate: ${(calc.insurance_rate * 100).toFixed(2)}%`);
  lines.push(`- Freight from China (Nansha → Alexandria): $${calc.freight_cn} · ${calc.transit_cn} days`);
  lines.push(`- Freight from UAE (Jebel Ali → Alexandria): $${calc.freight_ae} · ${calc.transit_ae} days`);
  lines.push(`- Clearance + ACI/Nafeza: $${calc.clearance_usd}`);
  lines.push(`- Inland delivery: $${calc.inland_delivery_usd}`);
  lines.push(`- MotoLinkers consulting fee: ${(calc.consulting_fee_pct * 100).toFixed(1)}%`);
  lines.push(`- Payment fee — direct USD: ${(calc.payment_usd_fee * 100).toFixed(1)}%`);
  lines.push(`- Payment fee — bank transfer: ${(calc.payment_bank_fee * 100).toFixed(1)}%`);
  lines.push("");

  // News — titles + excerpts only.
  if (news.length > 0) {
    lines.push("## Recent news (most recent first)");
    for (const n of news.slice(0, 10)) {
      lines.push(`- **${n.title}**${n.excerpt ? ` — ${n.excerpt}` : ""} (slug: ${n.slug})`);
    }
    lines.push("");
  }

  // Pages — flatten each section into prose.
  lines.push("## Page content");
  for (const { slug, sections } of pages) {
    if (sections.length === 0) continue;
    lines.push(`\n### /${slug === "home" ? "" : slug}`);
    for (const s of sections) {
      const text = sectionToText(s.type, s.data);
      if (text) lines.push(text);
    }
  }
  lines.push("");

  // Hard contact info — if the user wants a human.
  lines.push("## Direct contact");
  lines.push("- Email: info@motolinkers.com");
  lines.push("- Phone: +20 100 000 78104");
  lines.push("- Office: Office (ACO2), Floor 4, Building 100, Al-Mirghani Street, Heliopolis, Cairo");
  lines.push("- Working hours: Sun–Thu 11:00–23:00 · Sat 15:00–23:00 · Fri closed");

  return lines.join("\n");
}

// ─── per-section text extractors ─────────────────────────────────

function sectionToText(type: string, raw: unknown): string {
  const d = (raw ?? {}) as Record<string, unknown>;
  const txt = (v: unknown) => (typeof v === "string" ? stripHtml(v) : "");
  const arr = <T = unknown>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

  switch (type) {
    case "page_header":
      return [txt(d.kicker), txt(d.title_html)].filter(Boolean).join(" — ");
    case "paragraph":
      return txt(d.text);
    case "qa": {
      const q = txt(d.question);
      const a = txt(d.answer_html);
      return q && a ? `**Q: ${q}**\n${a}` : "";
    }
    case "legal_clause": {
      const h = txt(d.heading);
      const b = txt(d.body_html);
      const items = arr<string>(d.list_items).map((x) => `- ${stripHtml(x)}`).join("\n");
      return [h ? `**${h}**` : "", b, items].filter(Boolean).join("\n");
    }
    case "manifesto": {
      const head = [txt(d.kicker), txt(d.title_html)].filter(Boolean).join(" — ");
      const body = arr<string>(d.body_paragraphs_html).map(stripHtml).join(" ");
      const pillars = arr<{ number?: unknown; title?: unknown; body?: unknown }>(d.pillars)
        .map((p) => `- ${txt(p.number)}: **${txt(p.title)}** — ${txt(p.body)}`)
        .join("\n");
      return [head, body, pillars].filter(Boolean).join("\n");
    }
    case "process": {
      const head = [txt(d.kicker), txt(d.title_html)].filter(Boolean).join(" — ");
      const steps = arr<{ number?: unknown; title?: unknown; body?: unknown }>(d.steps)
        .map((s) => `${txt(s.number)}. **${txt(s.title)}** — ${txt(s.body)}`)
        .join("\n");
      return [head, steps].filter(Boolean).join("\n");
    }
    case "testimonials": {
      const head = [txt(d.kicker), txt(d.title_html)].filter(Boolean).join(" — ");
      const items = arr<{ name?: unknown; role?: unknown; quote?: unknown }>(d.items)
        .map((t) => `- "${txt(t.quote)}" — ${txt(t.name)}, ${txt(t.role)}`)
        .join("\n");
      return [head, items].filter(Boolean).join("\n");
    }
    case "stats_grid": {
      const items = arr<{ target?: unknown; suffix?: unknown; label?: unknown }>(d.items)
        .map((s) => `${s.target}${typeof s.suffix === "string" ? s.suffix : ""} ${txt(s.label)}`)
        .join("; ");
      return items ? `Stats: ${items}` : "";
    }
    case "cta_block": {
      return [txt(d.title_html), txt(d.body_html)].filter(Boolean).join(" ");
    }
    case "marquee": {
      const items = arr<{ text?: unknown }>(d.items)
        .map((b) => txt(b.text))
        .filter(Boolean)
        .join(", ");
      return items ? `Brands featured: ${items}` : "";
    }
    case "fleet_grid":
    case "calculator_widget":
    case "hero_block":
    case "routes":
      // Hero / routes / fleet / calculator widgets carry mostly visual
      // information already covered by the structured sections above.
      // Skip them in the agent prompt to save tokens.
      return "";
    default:
      return "";
  }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// ─── system prompt builder ───────────────────────────────────────

export interface PromptOptions {
  locale: "en" | "ar";
  extras?: string;
}

const PERSONA_EN = `You are MotoAgent, the bilingual assistant for MotoLinkers — an Egypt-based automotive supply-chain consultancy that helps clients import EVs and hybrids from China and the UAE.

Style:
- Reply in English when the user writes in English. Reply in Arabic when the user writes in Arabic. Match formality to the user's tone.
- Keep answers concise (2–6 short paragraphs or a tight bulleted list). Numbers and price ranges first, narrative second.
- Never invent prices, timelines, tax rates, or regulatory rules that contradict the source data below. If you don't know, say so plainly and offer to put the user in touch with a human.
- Stay on topic: vehicles, importing, customs, freight, EV ownership in Egypt, MotoLinkers's services. Politely redirect off-topic questions.
- If the user asks to talk to a human, share +20 100 000 78104 or info@motolinkers.com.
- Don't share, ask for, or store national IDs, passport numbers, payment card numbers, or passwords.

Source data (single source of truth — do not contradict it):
`;

const PERSONA_AR = `أنت MotoAgent، المساعد ثنائي اللغة لشركة MotoLinkers — وهي شركة استشارات لسلاسل الإمداد للسيارات مقرها مصر، تساعد العملاء على استيراد السيارات الكهربائية والهجينة من الصين والإمارات.

أسلوبك:
- أجب بالعربية إذا كتب المستخدم بالعربية، وبالإنجليزية إذا كتب بالإنجليزية. تطابق مع نبرة المستخدم.
- اجعل الإجابات موجزة (٢–٦ فقرات قصيرة أو قائمة نقاط مختصرة). الأرقام والأسعار أولاً ثم السرد.
- لا تختلق أبداً أسعاراً أو مواعيد أو نسب ضرائب أو قواعد تنظيمية تتعارض مع البيانات المصدر بالأسفل. إذا لم تعرف، قلها بوضوح واعرض ربط المستخدم بشخص.
- ابقَ على الموضوع: السيارات، الاستيراد، الجمارك، الشحن، امتلاك السيارات الكهربائية في مصر، خدمات MotoLinkers. اصرف الأسئلة الخارجة عن الموضوع بأدب.
- إذا طلب المستخدم التحدث مع شخص، شارك ‎+20 100 000 78104‎ أو info@motolinkers.com.
- لا تشارك أو تطلب أو تخزّن أرقام الهوية الوطنية أو جواز السفر أو أرقام البطاقات المصرفية أو كلمات المرور.

البيانات المصدر (المرجع الوحيد — لا تتعارض معه):
`;

export async function buildSystemPrompt(opts: PromptOptions): Promise<string> {
  const persona = opts.locale === "ar" ? PERSONA_AR : PERSONA_EN;
  const digest = await getKnowledgeDigest();
  const extras = opts.extras?.trim() ? `\n\nOperator notes:\n${opts.extras.trim()}` : "";
  return `${persona}\n${digest}${extras}`;
}
