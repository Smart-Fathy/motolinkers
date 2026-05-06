"use client";

import { useId, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

export function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="adm__field adm__field--full">
      <label className="adm__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="text"
        className="adm__input"
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
      />
      {hint && (
        <p
          style={{
            margin: ".4rem 0 0",
            fontSize: ".78rem",
            color: "var(--stone)",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextareaField({
  label,
  name,
  defaultValue,
  placeholder,
  rows = 4,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="adm__field adm__field--full">
      <label className="adm__label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        className="adm__input"
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
      />
      {hint && (
        <p
          style={{
            margin: ".4rem 0 0",
            fontSize: ".78rem",
            color: "var(--stone)",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

// Inline HTML field — a textarea/input with a click-to-wrap toolbar.
// Buttons wrap the current text selection in <em>, <strong>, or <a>
// (link prompts for href). If nothing is selected, the empty tag pair
// is inserted at the cursor. Server-side `sanitiseInlineHtml` enforces
// the allowlist independently.
export function HtmlField({
  label,
  name,
  defaultValue,
  placeholder,
  multiline = false,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  const id = useId();
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const hint =
    "Allowed tags: <em>, <strong>, <a href=\"…\">. Everything else is stripped.";

  function wrap(open: string, close: string, fallbackText = "") {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const selected = el.value.slice(start, end);
    const after = el.value.slice(end);
    const inner = selected || fallbackText;
    const next = `${before}${open}${inner}${close}${after}`;
    el.value = next;
    // Keep the form uncontrolled — we just mutated the DOM value
    // directly. Position the cursor inside the inserted tags so the
    // user can keep typing.
    const cursor = before.length + open.length + inner.length;
    requestAnimationFrame(() => {
      el.focus();
      try {
        el.setSelectionRange(cursor, cursor);
      } catch {
        // setSelectionRange isn't valid on every input type; ignore.
      }
    });
  }

  function insertLink() {
    const url = (typeof window !== "undefined" && window.prompt("Link URL", "https://")) || "";
    const trimmed = url.trim();
    if (!trimmed) return;
    // Escape double quotes inside href so the attribute stays valid.
    const safe = trimmed.replace(/"/g, "&quot;");
    wrap(`<a href="${safe}">`, "</a>", "link");
  }

  return (
    <div className="adm__field adm__field--full">
      <label className="adm__label" htmlFor={id}>
        {label}
      </label>
      <div
        style={{
          display: "flex",
          gap: ".4rem",
          marginBottom: ".4rem",
          flexWrap: "wrap",
        }}
      >
        <ToolbarButton
          label="EM"
          title="Wrap selection in <em> (italic)"
          onMouseDown={(e) => {
            e.preventDefault();
            wrap("<em>", "</em>");
          }}
        />
        <ToolbarButton
          label="STRONG"
          title="Wrap selection in <strong> (bold)"
          onMouseDown={(e) => {
            e.preventDefault();
            wrap("<strong>", "</strong>");
          }}
        />
        <ToolbarButton
          label="LINK"
          title="Wrap selection in <a href>"
          onMouseDown={(e) => {
            e.preventDefault();
            insertLink();
          }}
        />
      </div>
      {multiline ? (
        <textarea
          ref={(el) => {
            ref.current = el;
          }}
          id={id}
          name={name}
          rows={rows}
          className="adm__input"
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
        />
      ) : (
        <input
          ref={(el) => {
            ref.current = el;
          }}
          id={id}
          name={name}
          type="text"
          className="adm__input"
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
        />
      )}
      <p
        style={{
          margin: ".4rem 0 0",
          fontSize: ".78rem",
          color: "var(--stone)",
        }}
      >
        {hint}
      </p>
    </div>
  );
}

function ToolbarButton({
  label,
  title,
  onMouseDown,
}: {
  label: string;
  title: string;
  onMouseDown: (e: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={onMouseDown}
      style={{
        fontFamily: "var(--ff-mono)",
        fontSize: ".68rem",
        letterSpacing: ".12em",
        padding: ".35rem .7rem",
        borderRadius: 6,
        border: "1px solid var(--line-strong)",
        background: "rgba(238,232,220,.04)",
        color: "var(--bone)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export function NumberField({
  label,
  name,
  defaultValue,
  min,
  max,
  step,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="adm__field">
      <label className="adm__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type="number"
        className="adm__input"
        defaultValue={defaultValue ?? ""}
        min={min}
        max={max}
        step={step ?? "any"}
      />
      {hint && (
        <p
          style={{
            margin: ".4rem 0 0",
            fontSize: ".78rem",
            color: "var(--stone)",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
}) {
  const id = useId();
  return (
    <div className="adm__field">
      <label className="adm__label" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        name={name}
        className="adm__input"
        defaultValue={defaultValue ?? options[0]?.value ?? ""}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckField({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="adm__field adm__field--full">
      <label className="adm__checkbox">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} />
        <span>{label}</span>
      </label>
    </div>
  );
}
