"use client";

import { useState, useTransition } from "react";
import {
  createSection,
  updateSection,
  deleteSection,
  moveSection,
} from "./actions";
import TypedSectionFields from "./forms/TypedSectionFields";
import type { PageSlug } from "@/lib/repositories/pages";

type SectionRow = {
  id: string;
  page_slug: string;
  position: number;
  type: string;
  data: unknown;
  is_visible: boolean;
};

// Visible types in the picker dropdown. Order = the order shown in
// the menu. Internal placeholder types (heading, rich_text, gallery,
// list, cta, spacer, divider, embed) aren't here yet because they
// don't have admin forms.
const SECTION_TYPE_OPTIONS: { value: string; label: string; group: string }[] = [
  { value: "page_header", label: "Page header", group: "Layout" },
  { value: "paragraph", label: "Paragraph", group: "Content" },
  { value: "image", label: "Image", group: "Content" },
  { value: "qa", label: "Q & A (FAQ entry)", group: "Content" },
  { value: "legal_clause", label: "Legal clause", group: "Content" },
  { value: "hero_block", label: "Hero block", group: "Home sections" },
  { value: "marquee", label: "Brand marquee", group: "Home sections" },
  { value: "manifesto", label: "Manifesto pillars", group: "Home sections" },
  { value: "fleet_grid", label: "Fleet grid", group: "Home sections" },
  { value: "calculator_widget", label: "Calculator widget", group: "Home sections" },
  { value: "routes", label: "Trade lanes / routes", group: "Home sections" },
  { value: "process", label: "Process steps", group: "Home sections" },
  { value: "testimonials", label: "Testimonials", group: "Home sections" },
  { value: "stats_grid", label: "Stats grid", group: "Home sections" },
  { value: "cta_block", label: "CTA block", group: "Home sections" },
];

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  SECTION_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

export default function SectionsEditor({
  slug,
  sections,
}: {
  slug: PageSlug;
  sections: SectionRow[];
}) {
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function clearMessages() {
    setError(null);
  }

  function onAddSubmit(type: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearMessages();
    const fd = new FormData(e.currentTarget);
    fd.set("page_slug", slug);
    fd.set("type", type);
    startTransition(async () => {
      const result = await createSection(fd);
      if (!result.ok) setError(result.error);
      else {
        setAdding(null);
        window.location.reload();
      }
    });
  }

  function onMove(id: string, direction: "up" | "down") {
    clearMessages();
    startTransition(async () => {
      const result = await moveSection(id, slug, direction);
      if (!result.ok) setError(result.error);
      else window.location.reload();
    });
  }

  function onDelete(id: string) {
    if (!confirm("Delete this section? This can't be undone.")) return;
    clearMessages();
    startTransition(async () => {
      const result = await deleteSection(id, slug);
      if (!result.ok) setError(result.error);
      else window.location.reload();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
      {error && <div className="adm__error">{error}</div>}

      {sections.length === 0 && !adding && (
        <p style={{ color: "var(--stone)", fontSize: ".95rem" }}>
          No sections yet. Use the picker below to add one.
        </p>
      )}

      {sections.map((s, idx) => (
        <SectionCard
          key={s.id}
          section={s}
          slug={slug}
          isFirst={idx === 0}
          isLast={idx === sections.length - 1}
          pending={pending}
          onMoveUp={() => onMove(s.id, "up")}
          onMoveDown={() => onMove(s.id, "down")}
          onDelete={() => onDelete(s.id)}
          onError={(msg) => setError(msg)}
        />
      ))}

      {adding && (
        <NewSectionFrame
          title={`New ${TYPE_LABEL[adding] ?? adding}`}
          onCancel={() => setAdding(null)}
        >
          <form className="adm__form" onSubmit={(e) => onAddSubmit(adding, e)}>
            <TypedSectionFields type={adding} data={{}} />
            <div className="adm__form-actions">
              <button type="submit" className="adm__btn adm__btn--primary" disabled={pending}>
                {pending ? "Adding…" : `Add ${TYPE_LABEL[adding] ?? adding}`}
              </button>
            </div>
          </form>
        </NewSectionFrame>
      )}

      {!adding && <TypePicker onPick={(t) => setAdding(t)} />}
    </div>
  );
}

function TypePicker({ onPick }: { onPick: (type: string) => void }) {
  const [type, setType] = useState<string>("");
  return (
    <div
      style={{
        display: "flex",
        gap: ".7rem",
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="adm__input"
        style={{ flex: 1, minWidth: 240 }}
      >
        <option value="">Choose a section type to add…</option>
        {Array.from(new Set(SECTION_TYPE_OPTIONS.map((o) => o.group))).map((g) => (
          <optgroup key={g} label={g}>
            {SECTION_TYPE_OPTIONS.filter((o) => o.group === g).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <button
        type="button"
        className="adm__btn adm__btn--primary"
        disabled={!type}
        onClick={() => {
          if (type) onPick(type);
        }}
      >
        Add section
      </button>
    </div>
  );
}

function NewSectionFrame({
  title,
  onCancel,
  children,
}: {
  title: string;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--line-strong)",
        borderRadius: 12,
        padding: "1.2rem 1.2rem .9rem",
        background: "var(--ink-2)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: ".9rem",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1rem", color: "var(--bone)" }}>{title}</h2>
        <button type="button" className="adm__btn adm__btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {children}
    </div>
  );
}

function SectionCard({
  section,
  slug,
  isFirst,
  isLast,
  pending,
  onMoveUp,
  onMoveDown,
  onDelete,
  onError,
}: {
  section: SectionRow;
  slug: PageSlug;
  isFirst: boolean;
  isLast: boolean;
  pending: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onError: (msg: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [savePending, startSave] = useTransition();

  function onEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("page_slug", slug);
    fd.set("type", section.type);
    startSave(async () => {
      const result = await updateSection(section.id, fd);
      if (!result.ok) onError(result.error);
      else {
        setEditing(false);
        window.location.reload();
      }
    });
  }

  return (
    <article
      style={{
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "1rem 1.2rem",
        background: section.is_visible ? "var(--ink-2)" : "rgba(40,40,40,.4)",
        opacity: section.is_visible ? 1 : 0.7,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: ".7rem",
          marginBottom: ".7rem",
        }}
      >
        <span
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: ".7rem",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: "var(--stone)",
          }}
        >
          #{section.position} · {TYPE_LABEL[section.type] ?? section.type}
        </span>
        {!section.is_visible && <span className="adm__pill adm__pill--off">Hidden</span>}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="adm__btn adm__btn--ghost"
          onClick={onMoveUp}
          disabled={isFirst || pending}
          aria-label="Move up"
          title="Move up"
        >
          ↑
        </button>
        <button
          type="button"
          className="adm__btn adm__btn--ghost"
          onClick={onMoveDown}
          disabled={isLast || pending}
          aria-label="Move down"
          title="Move down"
        >
          ↓
        </button>
        <button
          type="button"
          className="adm__btn adm__btn--ghost"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "Close" : "Edit"}
        </button>
        <button
          type="button"
          className="adm__btn adm__btn--ghost"
          onClick={onDelete}
          disabled={pending}
          style={{ color: "#e87b7b" }}
        >
          Delete
        </button>
      </header>

      {!editing && <SectionPreview section={section} />}

      {editing && (
        <form className="adm__form" onSubmit={onEditSubmit}>
          <TypedSectionFields type={section.type} data={section.data} />
          <div className="adm__field adm__field--full">
            <label className="adm__checkbox">
              <input
                type="checkbox"
                name="is_visible"
                defaultChecked={section.is_visible}
              />
              <span>Visible on public page</span>
            </label>
          </div>
          <div className="adm__form-actions">
            <button type="submit" className="adm__btn adm__btn--primary" disabled={savePending}>
              {savePending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

function SectionPreview({ section }: { section: SectionRow }) {
  const data = (section.data ?? {}) as Record<string, unknown>;
  const txt = (v: unknown): string => (typeof v === "string" ? v : "");

  if (section.type === "paragraph") {
    return (
      <p style={{ margin: 0, color: "var(--bone)", opacity: 0.85, whiteSpace: "pre-wrap" }}>
        {txt(data.text) || <em style={{ color: "var(--stone)" }}>(empty)</em>}
      </p>
    );
  }
  if (section.type === "image") {
    const url = txt(data.url);
    if (!url) return <em style={{ color: "var(--stone)" }}>(no image)</em>;
    return (
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          style={{
            width: 180,
            height: 110,
            objectFit: "cover",
            borderRadius: 8,
            border: "1px solid var(--line)",
          }}
        />
        <div style={{ fontSize: ".85rem", color: "var(--stone)" }}>
          {txt(data.caption) || "—"}
        </div>
      </div>
    );
  }

  // Generic preview: a one-liner from the most identifying field for
  // each type. Keeps the list scannable without opening every section.
  const summary =
    txt(data.title_html) ||
    txt(data.kicker) ||
    txt(data.heading) ||
    txt(data.question) ||
    "(no summary)";
  return (
    <p style={{ margin: 0, color: "var(--bone)", opacity: 0.78, fontSize: ".95rem" }}>
      {summary.replace(/<[^>]+>/g, "")}
    </p>
  );
}
