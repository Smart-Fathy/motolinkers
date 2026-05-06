import type { CSSProperties } from "react";

// Shared typography style block carried on every page_section's `data`
// payload. Optional — sections without a style render with their
// component's defaults. Inherited CSS properties (color, font-size,
// font-style, font-weight, text-align) propagate to descendants unless
// the descendant sets its own value.

export type ColorToken =
  | "bone"
  | "stone"
  | "volt"
  | "gold"
  | "white"
  | "ink";

export interface SectionStyle {
  font_size?: string;
  font_weight?: 300 | 400 | 500 | 600 | 700;
  font_style?: "normal" | "italic";
  color?: ColorToken;
  align?: "left" | "center" | "right";
}

const FONT_SIZE_RE = /^\d+(?:\.\d+)?(?:px|rem|em)$/;
const FONT_WEIGHTS = [300, 400, 500, 600, 700] as const;
const FONT_STYLES = ["normal", "italic"] as const;
const ALIGN_VALUES = ["left", "center", "right"] as const;
const COLOR_TOKENS = ["bone", "stone", "volt", "gold", "white", "ink"] as const;

interface RawStyleInput {
  font_size?: unknown;
  font_weight?: unknown;
  font_style?: unknown;
  color?: unknown;
  align?: unknown;
}

// Server-side validator. Drops anything outside the allowlist; returns
// undefined when nothing is set so the JSON stays compact.
export function sanitiseStyle(raw: RawStyleInput | null | undefined): SectionStyle | undefined {
  if (!raw) return undefined;
  const out: SectionStyle = {};

  if (typeof raw.font_size === "string") {
    const trimmed = raw.font_size.trim();
    if (trimmed && FONT_SIZE_RE.test(trimmed)) out.font_size = trimmed;
  }

  const fwRaw = typeof raw.font_weight === "number" ? raw.font_weight : Number(raw.font_weight);
  if (Number.isFinite(fwRaw) && (FONT_WEIGHTS as readonly number[]).includes(fwRaw)) {
    out.font_weight = fwRaw as SectionStyle["font_weight"];
  }

  if (typeof raw.font_style === "string" && (FONT_STYLES as readonly string[]).includes(raw.font_style)) {
    out.font_style = raw.font_style as SectionStyle["font_style"];
  }

  if (typeof raw.color === "string" && (COLOR_TOKENS as readonly string[]).includes(raw.color)) {
    out.color = raw.color as ColorToken;
  }

  if (typeof raw.align === "string" && (ALIGN_VALUES as readonly string[]).includes(raw.align)) {
    out.align = raw.align as SectionStyle["align"];
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

const COLOR_TOKEN_CSS: Record<ColorToken, string> = {
  bone: "var(--bone)",
  stone: "var(--stone)",
  volt: "var(--volt)",
  gold: "var(--gold)",
  white: "#ffffff",
  ink: "var(--ink)",
};

export function styleToCSSProperties(s?: SectionStyle | null): CSSProperties {
  if (!s) return {};
  const css: CSSProperties = {};
  if (s.font_size) css.fontSize = s.font_size;
  if (s.font_weight) css.fontWeight = s.font_weight;
  if (s.font_style) css.fontStyle = s.font_style;
  if (s.color) css.color = COLOR_TOKEN_CSS[s.color];
  if (s.align) css.textAlign = s.align;
  return css;
}

// Read a section's style block from a `data` payload (loose-typed so it
// can pull from JSON columns without casting at every call site).
export function readStyleFromData(data: unknown): SectionStyle | undefined {
  if (!data || typeof data !== "object") return undefined;
  const s = (data as { style?: unknown }).style;
  if (!s || typeof s !== "object") return undefined;
  return sanitiseStyle(s as RawStyleInput);
}

// Admin-form dropdown options. Centralised so the form and the
// validator agree on the allowed values.
export const COLOR_TOKEN_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Default" },
  { value: "bone", label: "Bone (default body)" },
  { value: "stone", label: "Stone (muted)" },
  { value: "volt", label: "Volt / Gold (accent)" },
  { value: "gold", label: "Gold" },
  { value: "white", label: "White" },
  { value: "ink", label: "Ink (dark)" },
];

export const FONT_WEIGHT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Default" },
  { value: "300", label: "Light (300)" },
  { value: "400", label: "Regular (400)" },
  { value: "500", label: "Medium (500)" },
  { value: "600", label: "Semibold (600)" },
  { value: "700", label: "Bold (700)" },
];

export const FONT_STYLE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Default" },
  { value: "normal", label: "Normal" },
  { value: "italic", label: "Italic" },
];

export const ALIGN_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Default" },
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];
