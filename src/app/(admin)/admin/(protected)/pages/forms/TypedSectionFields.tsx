"use client";

import {
  TextField,
  TextareaField,
  HtmlField,
  NumberField,
  SelectField,
  CheckField,
} from "./fields/Fields";
import { RepeaterField } from "./fields/RepeaterField";
import { StyleFields } from "./fields/StyleFields";

// Each per-type fields component renders the right inputs for a single
// section's `data` shape. The parent submits the form via FormData;
// `actions.ts` `readSectionData()` reconstructs the typed shape.
//
// All fields are uncontrolled (defaultValue) so the data prop is read
// once on mount; the user's WIP persists across re-renders.

type Data = Record<string, unknown>;

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return fallback;
}
function asBool(v: unknown): boolean {
  return v === true;
}
function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

// ─── page_header ───────────────────────────────────────────────────
function PageHeaderFields({ data }: { data: Data }) {
  return (
    <>
      <TextField label="Kicker (small label)" name="kicker" defaultValue={asString(data.kicker)} />
      <HtmlField label="Title" name="title_html" defaultValue={asString(data.title_html)} />
    </>
  );
}

// ─── marquee ───────────────────────────────────────────────────────
function MarqueeFields({ data }: { data: Data }) {
  type Item = { text: string; italic?: boolean };
  const items = asArray<Item>(data.items);
  return (
    <RepeaterField<Item>
      label="Brands"
      namePrefix="items"
      defaultValues={items.length ? items : [{ text: "" }]}
      make={() => ({ text: "" })}
      itemLabel={(it) => it.text || "(empty)"}
      addButtonLabel="+ Brand"
      renderItem={(item, p) => (
        <>
          <TextField label="Text" name={`${p}.text`} defaultValue={item.text} />
          <CheckField label="Italic" name={`${p}.italic`} defaultChecked={!!item.italic} />
        </>
      )}
    />
  );
}

// ─── qa ────────────────────────────────────────────────────────────
function QaFields({ data }: { data: Data }) {
  return (
    <>
      <TextField label="Question" name="question" defaultValue={asString(data.question)} />
      <HtmlField
        label="Answer"
        name="answer_html"
        multiline
        rows={4}
        defaultValue={asString(data.answer_html)}
      />
    </>
  );
}

// ─── legal_clause ──────────────────────────────────────────────────
function LegalClauseFields({ data }: { data: Data }) {
  type ListItem = { text: string };
  const items = asArray<string>(data.list_items).map((t) => ({ text: t }));
  return (
    <>
      <TextField label="Heading" name="heading" defaultValue={asString(data.heading)} />
      <HtmlField
        label="Body"
        name="body_html"
        multiline
        rows={5}
        defaultValue={asString(data.body_html)}
      />
      <RepeaterField<ListItem>
        label="List items (optional)"
        namePrefix="list_items"
        defaultValues={items}
        make={() => ({ text: "" })}
        itemLabel={(it) => it.text.slice(0, 60) || "(empty)"}
        addButtonLabel="+ List item"
        renderItem={(item, p) => (
          <HtmlField label="Text" name={`${p}.text`} defaultValue={item.text} />
        )}
      />
    </>
  );
}

// ─── calculator_widget ─────────────────────────────────────────────
function CalculatorWidgetFields({ data }: { data: Data }) {
  return (
    <>
      <TextField label="Kicker" name="kicker" defaultValue={asString(data.kicker)} />
      <HtmlField label="Title" name="title_html" defaultValue={asString(data.title_html)} />
      <TextareaField
        label="Subtitle"
        name="subtitle"
        rows={3}
        defaultValue={asString(data.subtitle)}
      />
    </>
  );
}

// ─── fleet_grid ────────────────────────────────────────────────────
function FleetGridFields({ data }: { data: Data }) {
  return (
    <>
      <TextField label="Kicker" name="kicker" defaultValue={asString(data.kicker)} />
      <HtmlField label="Title" name="title_html" defaultValue={asString(data.title_html)} />
      <TextareaField
        label="Subtitle"
        name="subtitle"
        rows={3}
        defaultValue={asString(data.subtitle)}
      />
      <SelectField
        label="Mode"
        name="mode"
        defaultValue={asString(data.mode, "featured")}
        options={[
          { value: "featured", label: "Featured vehicles only" },
          { value: "all", label: "All published vehicles" },
        ]}
      />
    </>
  );
}

// ─── stats_grid ────────────────────────────────────────────────────
function StatsGridFields({ data }: { data: Data }) {
  type Item = { target: number; suffix: string; label: string };
  const items = asArray<Item>(data.items);
  return (
    <RepeaterField<Item>
      label="Stats"
      namePrefix="items"
      defaultValues={items.length ? items : [{ target: 0, suffix: "", label: "" }]}
      make={() => ({ target: 0, suffix: "", label: "" })}
      itemLabel={(it) => it.label || "(unnamed)"}
      addButtonLabel="+ Stat"
      renderItem={(item, p) => (
        <>
          <TextField label="Label" name={`${p}.label`} defaultValue={item.label} />
          <NumberField
            label="Target (counts up to)"
            name={`${p}.target`}
            defaultValue={item.target}
            min={0}
            step={1}
          />
          <TextField
            label="Suffix (e.g. %, +)"
            name={`${p}.suffix`}
            defaultValue={item.suffix}
          />
        </>
      )}
    />
  );
}

// ─── cta_block ─────────────────────────────────────────────────────
function CtaBlockFields({ data }: { data: Data }) {
  type Cta = { label: string; href: string; variant: "primary" | "ghost" };
  const ctas = asArray<Cta>(data.ctas);
  return (
    <>
      <HtmlField label="Title" name="title_html" defaultValue={asString(data.title_html)} />
      <HtmlField
        label="Body"
        name="body_html"
        multiline
        rows={3}
        defaultValue={asString(data.body_html)}
      />
      <TextField
        label="Arabic accent (optional)"
        name="arabic_accent"
        defaultValue={asString(data.arabic_accent)}
      />
      <CtaRepeater defaultValues={ctas} />
    </>
  );
}

function CtaRepeater({
  defaultValues,
  label = "Buttons",
}: {
  defaultValues: { label: string; href: string; variant: "primary" | "ghost" }[];
  label?: string;
}) {
  type Cta = { label: string; href: string; variant: "primary" | "ghost" };
  return (
    <RepeaterField<Cta>
      label={label}
      namePrefix="ctas"
      defaultValues={defaultValues.length ? defaultValues : []}
      make={() => ({ label: "", href: "", variant: "primary" })}
      itemLabel={(it) => it.label || "(empty)"}
      addButtonLabel="+ Button"
      renderItem={(item, p) => (
        <>
          <TextField label="Label" name={`${p}.label`} defaultValue={item.label} />
          <TextField label="Link (href)" name={`${p}.href`} defaultValue={item.href} />
          <SelectField
            label="Variant"
            name={`${p}.variant`}
            defaultValue={item.variant}
            options={[
              { value: "primary", label: "Primary (gold)" },
              { value: "ghost", label: "Ghost (outline)" },
            ]}
          />
        </>
      )}
    />
  );
}

// ─── process ───────────────────────────────────────────────────────
function ProcessFields({ data }: { data: Data }) {
  type Step = { number: string; title: string; body: string };
  const steps = asArray<Step>(data.steps);
  return (
    <>
      <TextField label="Kicker" name="kicker" defaultValue={asString(data.kicker)} />
      <HtmlField label="Title" name="title_html" defaultValue={asString(data.title_html)} />
      <RepeaterField<Step>
        label="Steps"
        namePrefix="steps"
        defaultValues={steps.length ? steps : []}
        make={() => ({ number: "", title: "", body: "" })}
        itemLabel={(it) => `${it.number} · ${it.title}` || "(empty)"}
        addButtonLabel="+ Step"
        renderItem={(item, p) => (
          <>
            <TextField label="Number (e.g. 01)" name={`${p}.number`} defaultValue={item.number} />
            <TextField label="Title" name={`${p}.title`} defaultValue={item.title} />
            <TextareaField label="Body" name={`${p}.body`} rows={3} defaultValue={item.body} />
          </>
        )}
      />
    </>
  );
}

// ─── manifesto ─────────────────────────────────────────────────────
function ManifestoFields({ data }: { data: Data }) {
  type Pillar = { number: string; title: string; body: string };
  const paragraphs = asArray<string>(data.body_paragraphs_html).map((t) => ({ text: t }));
  const pillars = asArray<Pillar>(data.pillars);
  return (
    <>
      <TextField label="Kicker" name="kicker" defaultValue={asString(data.kicker)} />
      <HtmlField label="Title" name="title_html" defaultValue={asString(data.title_html)} />
      <RepeaterField<{ text: string }>
        label="Body paragraphs"
        namePrefix="body_paragraphs_html"
        defaultValues={paragraphs}
        make={() => ({ text: "" })}
        itemLabel={(it, i) => `Paragraph ${i + 1}`}
        addButtonLabel="+ Paragraph"
        renderItem={(item, p) => (
          <HtmlField
            label="Text"
            name={`${p}.text`}
            multiline
            rows={4}
            defaultValue={item.text}
          />
        )}
      />
      <RepeaterField<Pillar>
        label="Pillars"
        namePrefix="pillars"
        defaultValues={pillars}
        make={() => ({ number: "", title: "", body: "" })}
        itemLabel={(it) => it.title || "(empty)"}
        addButtonLabel="+ Pillar"
        renderItem={(item, p) => (
          <>
            <TextField label="Number / kicker" name={`${p}.number`} defaultValue={item.number} />
            <TextField label="Title" name={`${p}.title`} defaultValue={item.title} />
            <TextareaField label="Body" name={`${p}.body`} rows={3} defaultValue={item.body} />
          </>
        )}
      />
    </>
  );
}

// ─── testimonials ──────────────────────────────────────────────────
function TestimonialsFields({ data }: { data: Data }) {
  type Item = { initials: string; name: string; role: string; quote: string };
  const items = asArray<Item>(data.items);
  return (
    <>
      <TextField label="Kicker" name="kicker" defaultValue={asString(data.kicker)} />
      <HtmlField label="Title" name="title_html" defaultValue={asString(data.title_html)} />
      <RepeaterField<Item>
        label="Testimonials"
        namePrefix="items"
        defaultValues={items}
        make={() => ({ initials: "", name: "", role: "", quote: "" })}
        itemLabel={(it) => it.name || "(unnamed)"}
        addButtonLabel="+ Testimonial"
        renderItem={(item, p) => (
          <>
            <TextField label="Name" name={`${p}.name`} defaultValue={item.name} />
            <TextField label="Initials" name={`${p}.initials`} defaultValue={item.initials} />
            <TextField label="Role" name={`${p}.role`} defaultValue={item.role} />
            <TextareaField label="Quote" name={`${p}.quote`} rows={3} defaultValue={item.quote} />
          </>
        )}
      />
    </>
  );
}

// ─── hero_block ────────────────────────────────────────────────────
function HeroBlockFields({ data }: { data: Data }) {
  const meta = asObject(data.meta);
  type TitleLine = { text: string };
  const titleLines = asArray<string>(data.title_lines).map((t) => ({ text: t }));
  type Ticker = { value: string; label: string; value_suffix?: string };
  const ticker = asArray<Ticker>(data.ticker);
  type Cta = { label: string; href: string; variant: "primary" | "ghost" };
  const ctas = asArray<Cta>(data.ctas);

  return (
    <>
      <TextField label="Meta · top-left" name="meta.col1_top" defaultValue={asString(meta.col1_top)} />
      <TextField label="Meta · bottom-left" name="meta.col1_bot" defaultValue={asString(meta.col1_bot)} />
      <TextField label="Meta · top-right" name="meta.col2_top" defaultValue={asString(meta.col2_top)} />
      <TextField label="Meta · bottom-right" name="meta.col2_bot" defaultValue={asString(meta.col2_bot)} />

      <RepeaterField<TitleLine>
        label="Title (one line per item)"
        namePrefix="title_lines"
        defaultValues={titleLines.length ? titleLines : [{ text: "" }]}
        make={() => ({ text: "" })}
        itemLabel={(it, i) => `Line ${i + 1}`}
        addButtonLabel="+ Line"
        renderItem={(item, p) => (
          <HtmlField label="Text" name={`${p}.text`} defaultValue={item.text} />
        )}
      />

      <TextField
        label="ARIA label (full title for screen readers)"
        name="aria_label"
        defaultValue={asString(data.aria_label)}
      />
      <HtmlField
        label="Lede"
        name="lede_html"
        multiline
        rows={3}
        defaultValue={asString(data.lede_html)}
      />

      <CtaRepeater defaultValues={ctas} label="Buttons" />

      <RepeaterField<Ticker>
        label="Side ticker"
        namePrefix="ticker"
        defaultValues={ticker}
        make={() => ({ value: "", label: "" })}
        itemLabel={(it) => it.label || "(unnamed)"}
        addButtonLabel="+ Ticker entry"
        renderItem={(item, p) => (
          <>
            <TextField label="Value" name={`${p}.value`} defaultValue={item.value} />
            <TextField
              label="Suffix (small, optional)"
              name={`${p}.value_suffix`}
              defaultValue={item.value_suffix ?? ""}
            />
            <TextField label="Label" name={`${p}.label`} defaultValue={item.label} />
          </>
        )}
      />

      <TextField
        label="Scroll indicator label"
        name="scroll_label"
        defaultValue={asString(data.scroll_label, "Scroll")}
      />
    </>
  );
}

// ─── routes ────────────────────────────────────────────────────────
function RoutesFields({ data }: { data: Data }) {
  type RouteItem = {
    flag_from: string;
    flag_to: string;
    from: string;
    to: string;
    lane_label: string;
    freight_prefix: string;
    freight_value: string;
    transit_value: string;
    transit_suffix: string;
    carriers_value: string;
    carriers_suffix: string;
    svg_top_left: string;
    svg_top_right: string;
    svg_bottom: string;
    gradient_id: string;
    gradient_from: string;
    gradient_to: string;
    svg_path?: string;
    svg_dot_from?: { cx: number; cy: number };
    svg_dot_to?: { cx: number; cy: number };
    svg_top_left_pos?: { x: number; y: number };
    svg_top_right_pos?: { x: number; y: number };
    svg_bottom_pos?: { x: number; y: number };
  };
  const routes = asArray<RouteItem>(data.routes);
  const FLAGS = [
    { value: "cn", label: "China" },
    { value: "ae", label: "UAE" },
    { value: "eg", label: "Egypt" },
  ];
  return (
    <>
      <TextField label="Kicker" name="kicker" defaultValue={asString(data.kicker)} />
      <HtmlField label="Title" name="title_html" defaultValue={asString(data.title_html)} />
      <RepeaterField<RouteItem>
        label="Routes"
        namePrefix="routes"
        defaultValues={routes}
        make={() => ({
          flag_from: "cn",
          flag_to: "eg",
          from: "",
          to: "",
          lane_label: "",
          freight_prefix: "$",
          freight_value: "",
          transit_value: "",
          transit_suffix: "d",
          carriers_value: "",
          carriers_suffix: "+",
          svg_top_left: "",
          svg_top_right: "",
          svg_bottom: "",
          gradient_id: `grad${Date.now()}`,
          gradient_from: "#C9A84C",
          gradient_to: "#C9A84C",
        })}
        itemLabel={(it) => `${it.from} → ${it.to}`}
        addButtonLabel="+ Route"
        renderItem={(item, p) => (
          <>
            <TextField label="From (city)" name={`${p}.from`} defaultValue={item.from} />
            <TextField label="To (city)" name={`${p}.to`} defaultValue={item.to} />
            <SelectField
              label="From flag"
              name={`${p}.flag_from`}
              defaultValue={item.flag_from}
              options={FLAGS}
            />
            <SelectField
              label="To flag"
              name={`${p}.flag_to`}
              defaultValue={item.flag_to}
              options={FLAGS}
            />
            <TextField label="Lane label" name={`${p}.lane_label`} defaultValue={item.lane_label} />
            <TextField
              label="Freight prefix"
              name={`${p}.freight_prefix`}
              defaultValue={item.freight_prefix}
            />
            <TextField
              label="Freight value"
              name={`${p}.freight_value`}
              defaultValue={item.freight_value}
            />
            <TextField
              label="Transit value"
              name={`${p}.transit_value`}
              defaultValue={item.transit_value}
            />
            <TextField
              label="Transit suffix"
              name={`${p}.transit_suffix`}
              defaultValue={item.transit_suffix}
            />
            <TextField
              label="Carriers value"
              name={`${p}.carriers_value`}
              defaultValue={item.carriers_value}
            />
            <TextField
              label="Carriers suffix"
              name={`${p}.carriers_suffix`}
              defaultValue={item.carriers_suffix}
            />
            <TextField
              label="SVG label · top left"
              name={`${p}.svg_top_left`}
              defaultValue={item.svg_top_left}
            />
            <TextField
              label="SVG label · top right"
              name={`${p}.svg_top_right`}
              defaultValue={item.svg_top_right}
            />
            <TextField
              label="SVG label · bottom"
              name={`${p}.svg_bottom`}
              defaultValue={item.svg_bottom}
            />
            <TextField
              label="Gradient ID (must be unique)"
              name={`${p}.gradient_id`}
              defaultValue={item.gradient_id}
            />
            <TextField
              label="Gradient from (hex)"
              name={`${p}.gradient_from`}
              defaultValue={item.gradient_from}
            />
            <TextField
              label="Gradient to (hex)"
              name={`${p}.gradient_to`}
              defaultValue={item.gradient_to}
            />
            {/* Geometry: hidden — defaults are sensible. Power users
                can edit JSON directly in Supabase if needed. */}
            <input
              type="hidden"
              name={`${p}.svg_path`}
              defaultValue={item.svg_path ?? ""}
            />
            <input
              type="hidden"
              name={`${p}.svg_dot_from.cx`}
              defaultValue={item.svg_dot_from?.cx ?? ""}
            />
            <input
              type="hidden"
              name={`${p}.svg_dot_from.cy`}
              defaultValue={item.svg_dot_from?.cy ?? ""}
            />
            <input
              type="hidden"
              name={`${p}.svg_dot_to.cx`}
              defaultValue={item.svg_dot_to?.cx ?? ""}
            />
            <input
              type="hidden"
              name={`${p}.svg_dot_to.cy`}
              defaultValue={item.svg_dot_to?.cy ?? ""}
            />
            <input
              type="hidden"
              name={`${p}.svg_top_left_pos.x`}
              defaultValue={item.svg_top_left_pos?.x ?? ""}
            />
            <input
              type="hidden"
              name={`${p}.svg_top_left_pos.y`}
              defaultValue={item.svg_top_left_pos?.y ?? ""}
            />
            <input
              type="hidden"
              name={`${p}.svg_top_right_pos.x`}
              defaultValue={item.svg_top_right_pos?.x ?? ""}
            />
            <input
              type="hidden"
              name={`${p}.svg_top_right_pos.y`}
              defaultValue={item.svg_top_right_pos?.y ?? ""}
            />
            <input
              type="hidden"
              name={`${p}.svg_bottom_pos.x`}
              defaultValue={item.svg_bottom_pos?.x ?? ""}
            />
            <input
              type="hidden"
              name={`${p}.svg_bottom_pos.y`}
              defaultValue={item.svg_bottom_pos?.y ?? ""}
            />
          </>
        )}
      />
    </>
  );
}

// ─── existing types kept here for the dispatcher ──────────────────
function ParagraphFields({ data }: { data: Data }) {
  return (
    <TextareaField
      label="Text"
      name="text"
      rows={6}
      defaultValue={asString(data.text)}
      placeholder="Use a blank line to separate paragraphs."
    />
  );
}

function ImageFields({ data }: { data: Data }) {
  // The image upload UX (R2 picker) lives inside SectionsEditor
  // already; here we just expose the URL field plus dimensions/alt.
  return (
    <>
      <TextField label="Image URL" name="url" defaultValue={asString(data.url)} />
      <TextField label="Alt text" name="alt" defaultValue={asString(data.alt)} />
      <NumberField
        label="Width %"
        name="width_pct"
        defaultValue={asNumber(data.width_pct, 100)}
        min={20}
        max={100}
      />
      <NumberField
        label="Corner radius (px)"
        name="border_radius_px"
        defaultValue={asNumber(data.border_radius_px, 12)}
        min={0}
        max={64}
      />
      <NumberField
        label="Opacity (0.1 – 1)"
        name="opacity"
        defaultValue={asNumber(data.opacity, 1)}
        min={0.1}
        max={1}
        step={0.05}
      />
      <TextField label="Caption (optional)" name="caption" defaultValue={asString(data.caption)} />
    </>
  );
}

// Avoid unused warnings: every per-type sub-component is referenced
// from the dispatcher below, but TS noUnusedLocals can flag a few
// during partial edits. The cast keeps the surface area visible.
void ParagraphFields;
void ImageFields;
void asBool;

function renderTypeFields(type: string, d: Data) {
  switch (type) {
    case "paragraph":
      return <ParagraphFields data={d} />;
    case "image":
      return <ImageFields data={d} />;
    case "page_header":
      return <PageHeaderFields data={d} />;
    case "marquee":
      return <MarqueeFields data={d} />;
    case "qa":
      return <QaFields data={d} />;
    case "legal_clause":
      return <LegalClauseFields data={d} />;
    case "calculator_widget":
      return <CalculatorWidgetFields data={d} />;
    case "fleet_grid":
      return <FleetGridFields data={d} />;
    case "stats_grid":
      return <StatsGridFields data={d} />;
    case "cta_block":
      return <CtaBlockFields data={d} />;
    case "process":
      return <ProcessFields data={d} />;
    case "manifesto":
      return <ManifestoFields data={d} />;
    case "testimonials":
      return <TestimonialsFields data={d} />;
    case "hero_block":
      return <HeroBlockFields data={d} />;
    case "routes":
      return <RoutesFields data={d} />;
    default:
      return null;
  }
}

const SECTIONS_WITH_STYLE = new Set([
  "paragraph",
  "image",
  "page_header",
  "marquee",
  "qa",
  "legal_clause",
  "calculator_widget",
  "fleet_grid",
  "stats_grid",
  "cta_block",
  "process",
  "manifesto",
  "testimonials",
  "hero_block",
  "routes",
]);

export default function TypedSectionFields({
  type,
  data,
}: {
  type: string;
  data: unknown;
}) {
  const d: Data = (data ?? {}) as Data;
  const fields = renderTypeFields(type, d);
  if (!fields) {
    return (
      <p style={{ color: "var(--stone)", fontSize: ".9rem" }}>
        This section type isn&rsquo;t editable yet.
      </p>
    );
  }
  return (
    <>
      {fields}
      {SECTIONS_WITH_STYLE.has(type) && <StyleFields data={d} />}
    </>
  );
}
