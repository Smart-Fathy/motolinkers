"use client";

import { useId } from "react";

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

// Inline HTML — same as TextField but with a hint about which tags are
// allowed. Server-side allowlist sanitiser strips everything else.
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
  const hint = "Allowed tags: <em>, <strong>, <a href=\"…\">. Everything else is stripped.";
  return multiline ? (
    <TextareaField
      label={label}
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      rows={rows}
      hint={hint}
    />
  ) : (
    <TextField
      label={label}
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      hint={hint}
    />
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
