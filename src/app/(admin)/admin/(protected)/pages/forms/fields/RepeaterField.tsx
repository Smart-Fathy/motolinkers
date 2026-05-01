"use client";

import { useRef, useState, type ReactNode } from "react";

// Generic repeater: renders an array of editable items with add/remove
// /up/down controls. The form data is gathered by the parent via
// hidden inputs that the consumer renders inside `renderItem`. The
// repeater itself doesn't write to FormData — it just manages the
// in-memory item array and lets the consumer wire each field name as
// `${namePrefix}.${index}.${field}`. `actions.ts` reads these
// indexed-flat keys back into an array.
//
// Each item gets a stable React `_rid` so that uncontrolled inputs
// don't carry over content when the array is reordered or trimmed.
// The id is a render-only marker — it never touches the database.

interface KeyedItem {
  _rid: number;
}

let ridCounter = 0;
function nextRid() {
  ridCounter += 1;
  return ridCounter;
}

export function RepeaterField<T>({
  label,
  namePrefix,
  defaultValues,
  make,
  renderItem,
  itemLabel,
  minItems = 0,
  maxItems = 50,
  addButtonLabel = "+ Add",
}: {
  label: string;
  namePrefix: string;
  defaultValues: T[];
  make: () => T;
  renderItem: (item: T, namePrefix: string, index: number) => ReactNode;
  itemLabel?: (item: T, index: number) => string;
  minItems?: number;
  maxItems?: number;
  addButtonLabel?: string;
}) {
  // Wrap every initial item with a stable rid so reorder/remove keep
  // their inputs distinct.
  const initial = useRef<(T & KeyedItem)[]>(
    defaultValues.map((v) => ({ ...(v as T), _rid: nextRid() }) as T & KeyedItem),
  );
  const [items, setItems] = useState<(T & KeyedItem)[]>(initial.current);

  function add() {
    if (items.length >= maxItems) return;
    setItems([...items, { ...(make() as T), _rid: nextRid() } as T & KeyedItem]);
  }
  function remove(idx: number) {
    if (items.length <= minItems) return;
    setItems(items.filter((_, i) => i !== idx));
  }
  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
  }

  return (
    <div className="adm__field adm__field--full">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: ".5rem",
        }}
      >
        <span className="adm__label" style={{ margin: 0 }}>
          {label}
        </span>
        <span style={{ color: "var(--stone)", fontSize: ".78rem" }}>
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Hidden count input — server reads it to know how many items
          to harvest from the indexed names. */}
      <input type="hidden" name={`${namePrefix}.count`} value={items.length} />

      {items.length === 0 && (
        <p style={{ color: "var(--stone)", fontSize: ".88rem", margin: ".4rem 0" }}>
          No items yet.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: ".7rem" }}>
        {items.map((item, idx) => (
          <div
            key={item._rid}
            style={{
              border: "1px solid var(--line)",
              borderRadius: 10,
              padding: ".9rem 1rem",
              background: "rgba(255,255,255,.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".5rem",
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
                {itemLabel ? itemLabel(item, idx) : `#${idx + 1}`}
              </span>
              <span style={{ flex: 1 }} />
              <button
                type="button"
                className="adm__btn adm__btn--ghost"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                aria-label="Move up"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="adm__btn adm__btn--ghost"
                onClick={() => move(idx, 1)}
                disabled={idx === items.length - 1}
                aria-label="Move down"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                className="adm__btn adm__btn--ghost"
                onClick={() => remove(idx)}
                disabled={items.length <= minItems}
                style={{ color: "#e87b7b" }}
              >
                Remove
              </button>
            </div>
            {renderItem(item, `${namePrefix}.${idx}`, idx)}
          </div>
        ))}
      </div>

      <div style={{ marginTop: ".7rem" }}>
        <button
          type="button"
          className="adm__btn adm__btn--ghost"
          onClick={add}
          disabled={items.length >= maxItems}
        >
          {addButtonLabel}
        </button>
      </div>
    </div>
  );
}
