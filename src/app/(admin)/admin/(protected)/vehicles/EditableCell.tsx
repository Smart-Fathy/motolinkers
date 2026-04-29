"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import { quickUpdateVehicle } from "./quick-edit-action";

export type SelectOption = { value: string; label: string };

type Common = {
  id: string;
  field: string;
  className?: string;
};

type Props =
  | (Common & {
      kind: "text" | "number";
      value: string | number | null;
      placeholder?: string;
      // Pre-formatted display string (e.g. "EGP 1,500,000"). Must be a
      // serialisable string, not a function — server components can't
      // ship a callback across the RSC boundary.
      displayValue?: string;
    })
  | (Common & {
      kind: "select";
      value: string | null;
      options: SelectOption[];
      allowEmpty?: boolean;
      emptyLabel?: string;
    })
  | (Common & {
      kind: "toggle";
      value: boolean;
      onLabel: string;
      offLabel: string;
    });

export default function EditableCell(props: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const persist = (next: unknown) => {
    setError(null);
    startTransition(async () => {
      const result = await quickUpdateVehicle(props.id, props.field, next);
      if ("error" in result) setError(result.error);
    });
  };

  if (props.kind === "toggle") {
    const onClick = () => {
      // Optimistic — flip locally via next render after the action returns.
      // The page revalidates `/admin/vehicles` so the new value will land
      // on the next paint, but we toggle the button label immediately to
      // avoid feeling laggy.
      persist(!props.value);
    };
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={`adm__pill adm__pill--${props.value ? "on" : "off"} adm__cell-toggle`}
        title={error ?? "Click to toggle"}
      >
        {pending ? "…" : props.value ? props.onLabel : props.offLabel}
      </button>
    );
  }

  if (props.kind === "select") {
    const current = props.value ?? "";
    const onChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
      const next = e.target.value;
      if (next === current) return;
      persist(next === "" ? null : next);
    };
    const cellStyle: CSSProperties = error
      ? { outline: "1px solid #E47878" }
      : {};
    return (
      <span className="adm__cell-edit" style={cellStyle} title={error ?? ""}>
        <select
          value={current}
          onChange={onChange}
          disabled={pending}
          className="adm__cell-select"
        >
          {props.allowEmpty && (
            <option value="">{props.emptyLabel ?? "—"}</option>
          )}
          {props.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </span>
    );
  }

  return <FreeText {...props} pending={pending} error={error} persist={persist} />;
}

function FreeText({
  kind,
  value,
  placeholder,
  displayValue,
  className,
  pending,
  error,
  persist,
}: {
  kind: "text" | "number";
  value: string | number | null;
  placeholder?: string;
  displayValue?: string;
  className?: string;
  pending: boolean;
  error: string | null;
  persist: (next: unknown) => void;
}) {
  // `draft` is only meaningful while editing, so it's seeded by the
  // `enter` callback below and reset on cancel. Display mode reads
  // directly from the `value` prop, which lets the parent re-render
  // (after a successful save + revalidate) flow in without us having
  // to sync state from props in an effect.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const enter = () => {
    setDraft(value === null || value === undefined ? "" : String(value));
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (kind === "number") {
      const trimmed = draft.trim();
      if (trimmed === "" && value === null) return;
      const n = Number(trimmed);
      if (!Number.isFinite(n)) return; // snap back; display reads from value
      if (n === value) return;
      persist(n);
    } else {
      const trimmed = draft.trim();
      if (trimmed === (value ?? "")) return;
      persist(trimmed);
    }
  };

  const cancel = () => setEditing(false);

  const shown =
    displayValue ??
    (value === null || value === undefined || value === "" ? "—" : String(value));

  if (!editing) {
    return (
      <button
        type="button"
        onClick={enter}
        className={`adm__cell-edit adm__cell-display ${className ?? ""}`.trim()}
        title={error ?? "Click to edit"}
        style={error ? { outline: "1px solid #E47878" } : undefined}
      >
        {pending ? "…" : shown}
      </button>
    );
  }

  return (
    <span
      className="adm__cell-edit"
      style={error ? { outline: "1px solid #E47878" } : undefined}
      title={error ?? ""}
    >
      <input
        ref={inputRef}
        type={kind === "number" ? "number" : "text"}
        className="adm__cell-input"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        disabled={pending}
      />
    </span>
  );
}
