"use client";

import { TextField, SelectField } from "./Fields";
import {
  ALIGN_OPTIONS,
  COLOR_TOKEN_OPTIONS,
  FONT_STYLE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  readStyleFromData,
} from "@/lib/cms-style";

// Typography overrides for any section. Lives in a collapsed
// <details> block so it doesn't clutter the per-type forms. All
// fields are optional — empty selections drop the property at save
// time and the renderer falls back to the section component's
// defaults.
//
// Inputs are submitted with `style.` prefix, e.g. `style.color`. The
// server-side `readSectionStyle` helper in actions.ts pulls them and
// runs them through `sanitiseStyle`.
export function StyleFields({ data }: { data: unknown }) {
  const s = readStyleFromData(data) ?? {};
  return (
    <details
      style={{
        marginTop: "1rem",
        border: "1px solid var(--line)",
        borderRadius: 10,
        padding: ".7rem 1rem",
        background: "rgba(238,232,220,.02)",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          fontFamily: "var(--ff-mono)",
          fontSize: ".74rem",
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "var(--stone)",
        }}
      >
        Typography
      </summary>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "0.6rem",
          marginTop: ".7rem",
        }}
      >
        <TextField
          label="Font size"
          name="style.font_size"
          defaultValue={s.font_size}
          placeholder="e.g. 1.2rem or 18px"
          hint="px, rem, or em"
        />
        <SelectField
          label="Font weight"
          name="style.font_weight"
          defaultValue={s.font_weight ? String(s.font_weight) : ""}
          options={FONT_WEIGHT_OPTIONS}
        />
        <SelectField
          label="Font style"
          name="style.font_style"
          defaultValue={s.font_style ?? ""}
          options={FONT_STYLE_OPTIONS}
        />
        <SelectField
          label="Color"
          name="style.color"
          defaultValue={s.color ?? ""}
          options={COLOR_TOKEN_OPTIONS}
        />
        <SelectField
          label="Alignment"
          name="style.align"
          defaultValue={s.align ?? ""}
          options={ALIGN_OPTIONS}
        />
      </div>
    </details>
  );
}
