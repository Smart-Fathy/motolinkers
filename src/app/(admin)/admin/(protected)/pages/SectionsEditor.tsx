"use client";

import { useRef, useState, useTransition } from "react";
import {
  createSection,
  updateSection,
  deleteSection,
  moveSection,
} from "./actions";
import { uploadPageImage } from "./upload-action";
import type { PageSlug } from "@/lib/repositories/pages";

type SectionRow = {
  id: string;
  page_slug: string;
  position: number;
  type: string;
  data: unknown;
  is_visible: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  paragraph: "Paragraph",
  image: "Image",
  heading: "Heading (coming soon)",
  rich_text: "Rich text (coming soon)",
  gallery: "Gallery (coming soon)",
  list: "List (coming soon)",
  cta: "CTA (coming soon)",
  spacer: "Spacer (coming soon)",
  divider: "Divider (coming soon)",
  embed: "Embed (coming soon)",
};

export default function SectionsEditor({
  slug,
  sections,
}: {
  slug: PageSlug;
  sections: SectionRow[];
}) {
  const [adding, setAdding] = useState<"paragraph" | "image" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function clearMessages() {
    setError(null);
  }

  function onAddSubmit(type: "paragraph" | "image", e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearMessages();
    const fd = new FormData(e.currentTarget);
    fd.set("page_slug", slug);
    fd.set("type", type);
    startTransition(async () => {
      const result = await createSection(fd);
      if ("error" in result) setError(result.error);
      else {
        setAdding(null);
        // Server action revalidates the public path; reload to see
        // the new row in admin too.
        window.location.reload();
      }
    });
  }

  function onMove(id: string, direction: "up" | "down") {
    clearMessages();
    startTransition(async () => {
      const result = await moveSection(id, slug, direction);
      if ("error" in result) setError(result.error);
      else window.location.reload();
    });
  }

  function onDelete(id: string) {
    if (!confirm("Delete this section? This can't be undone.")) return;
    clearMessages();
    startTransition(async () => {
      const result = await deleteSection(id, slug);
      if ("error" in result) setError(result.error);
      else window.location.reload();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
      {error && <div className="adm__error">{error}</div>}

      {sections.length === 0 && !adding && (
        <p style={{ color: "var(--stone)", fontSize: ".95rem" }}>
          No sections yet. Add the first one with the buttons below.
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

      {adding === "paragraph" && (
        <NewSectionFrame title="New paragraph" onCancel={() => setAdding(null)}>
          <form className="adm__form" onSubmit={(e) => onAddSubmit("paragraph", e)}>
            <ParagraphFields />
            <div className="adm__form-actions">
              <button type="submit" className="adm__btn adm__btn--primary" disabled={pending}>
                {pending ? "Adding…" : "Add paragraph"}
              </button>
            </div>
          </form>
        </NewSectionFrame>
      )}

      {adding === "image" && (
        <NewSectionFrame title="New image" onCancel={() => setAdding(null)}>
          <form className="adm__form" onSubmit={(e) => onAddSubmit("image", e)}>
            <ImageFields slug={slug} onError={setError} />
            <div className="adm__form-actions">
              <button type="submit" className="adm__btn adm__btn--primary" disabled={pending}>
                {pending ? "Adding…" : "Add image"}
              </button>
            </div>
          </form>
        </NewSectionFrame>
      )}

      {!adding && (
        <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="adm__btn adm__btn--ghost"
            onClick={() => setAdding("paragraph")}
          >
            + Paragraph
          </button>
          <button
            type="button"
            className="adm__btn adm__btn--ghost"
            onClick={() => setAdding("image")}
          >
            + Image
          </button>
        </div>
      )}
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
        <button
          type="button"
          className="adm__btn adm__btn--ghost"
          onClick={onCancel}
        >
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
      if ("error" in result) onError(result.error);
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
        {!section.is_visible && (
          <span className="adm__pill adm__pill--off">Hidden</span>
        )}
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

      {editing && section.type === "paragraph" && (
        <form className="adm__form" onSubmit={onEditSubmit}>
          <ParagraphFields data={section.data} />
          <VisibilityToggle isVisible={section.is_visible} />
          <div className="adm__form-actions">
            <button type="submit" className="adm__btn adm__btn--primary" disabled={savePending}>
              {savePending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
      {editing && section.type === "image" && (
        <form className="adm__form" onSubmit={onEditSubmit}>
          <ImageFields slug={slug} data={section.data} onError={onError} />
          <VisibilityToggle isVisible={section.is_visible} />
          <div className="adm__form-actions">
            <button type="submit" className="adm__btn adm__btn--primary" disabled={savePending}>
              {savePending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      )}
      {editing &&
        section.type !== "paragraph" &&
        section.type !== "image" && (
          <p style={{ color: "var(--stone)", fontSize: ".9rem" }}>
            This section type isn&rsquo;t editable yet — coming in a follow-up
            release. Delete and recreate as a paragraph or image for now.
          </p>
        )}
    </article>
  );
}

function VisibilityToggle({ isVisible }: { isVisible: boolean }) {
  return (
    <div className="adm__field adm__field--full">
      <label className="adm__checkbox">
        <input type="checkbox" name="is_visible" defaultChecked={isVisible} />
        <span>Visible on public page</span>
      </label>
    </div>
  );
}

function SectionPreview({ section }: { section: SectionRow }) {
  const data = (section.data ?? {}) as Record<string, unknown>;
  if (section.type === "paragraph") {
    const text = typeof data.text === "string" ? data.text : "";
    return (
      <p
        style={{
          margin: 0,
          color: "var(--bone)",
          opacity: 0.85,
          whiteSpace: "pre-wrap",
        }}
      >
        {text || <em style={{ color: "var(--stone)" }}>(empty)</em>}
      </p>
    );
  }
  if (section.type === "image") {
    const url = typeof data.url === "string" ? data.url : "";
    if (!url) {
      return <em style={{ color: "var(--stone)" }}>(no image)</em>;
    }
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
          {typeof data.caption === "string" && data.caption ? data.caption : "—"}
        </div>
      </div>
    );
  }
  return <em style={{ color: "var(--stone)" }}>(preview pending)</em>;
}

// ─── per-type field groups ───────────────────────────────────────────

function ParagraphFields({ data }: { data?: unknown }) {
  const d = (data ?? {}) as Record<string, unknown>;
  const initialText = typeof d.text === "string" ? d.text : "";
  const initialAlign = d.align === "center" ? "center" : "left";
  return (
    <>
      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="text">Text</label>
        <textarea
          id="text"
          name="text"
          rows={6}
          className="adm__input"
          defaultValue={initialText}
          placeholder="Use a blank line to separate paragraphs."
        />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="align">Alignment</label>
        <select
          id="align"
          name="align"
          className="adm__input"
          defaultValue={initialAlign}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
        </select>
      </div>
    </>
  );
}

function ImageFields({
  slug,
  data,
  onError,
}: {
  slug: PageSlug;
  data?: unknown;
  onError: (msg: string | null) => void;
}) {
  const d = (data ?? {}) as Record<string, unknown>;
  const [url, setUrl] = useState(typeof d.url === "string" ? d.url : "");
  const [widthPct, setWidthPct] = useState(
    typeof d.width_pct === "number" ? d.width_pct : 100,
  );
  const [radius, setRadius] = useState(
    typeof d.border_radius_px === "number" ? d.border_radius_px : 12,
  );
  const [opacity, setOpacity] = useState(
    typeof d.opacity === "number" ? d.opacity : 1,
  );
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("page_slug", slug);
      const result = await uploadPageImage(fd);
      if ("error" in result) onError(result.error);
      else setUrl(result.url);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <div className="adm__field adm__field--full">
        <label className="adm__label">Image URL</label>
        <div style={{ display: "flex", gap: ".7rem", flexWrap: "wrap" }}>
          <input
            type="text"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="adm__input"
            placeholder="https://images.motolinkers.com/pages/<slug>/…"
            style={{ flex: 1, minWidth: 280 }}
          />
          <button
            type="button"
            className="adm__btn adm__btn--ghost"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onPickFile}
          />
        </div>
      </div>
      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="alt">Alt text</label>
        <input
          id="alt"
          name="alt"
          type="text"
          className="adm__input"
          defaultValue={typeof d.alt === "string" ? d.alt : ""}
        />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="width_pct">
          Width ({widthPct}%)
        </label>
        <input
          id="width_pct"
          name="width_pct"
          type="range"
          min={20}
          max={100}
          value={widthPct}
          onChange={(e) => setWidthPct(Number(e.target.value))}
          className="adm__input"
        />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="border_radius_px">
          Corner radius ({radius} px)
        </label>
        <input
          id="border_radius_px"
          name="border_radius_px"
          type="range"
          min={0}
          max={64}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="adm__input"
        />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="opacity">
          Opacity ({opacity.toFixed(2)})
        </label>
        <input
          id="opacity"
          name="opacity"
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="adm__input"
        />
      </div>
      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="caption">Caption (optional)</label>
        <input
          id="caption"
          name="caption"
          type="text"
          className="adm__input"
          defaultValue={typeof d.caption === "string" ? d.caption : ""}
        />
      </div>
    </>
  );
}
