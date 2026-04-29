"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name-asc", label: "Name · A → Z" },
  { value: "name-desc", label: "Name · Z → A" },
  { value: "price-asc", label: "Price · low → high" },
  { value: "price-desc", label: "Price · high → low" },
  { value: "brand-asc", label: "Brand · A → Z" },
];

export default function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(searchParams.toString());
    if (e.target.value === "newest") next.delete("sort");
    else next.set("sort", e.target.value);
    const qs = next.toString();
    router.push(qs ? `/admin/vehicles?${qs}` : "/admin/vehicles");
  };

  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: ".5rem",
        fontFamily: "var(--ff-mono)",
        fontSize: ".7rem",
        letterSpacing: ".1em",
        textTransform: "uppercase",
        color: "var(--stone)",
      }}
    >
      Sort by
      <select
        value={value}
        onChange={onChange}
        className="adm__select"
        style={{
          padding: ".45rem .7rem",
          fontSize: ".85rem",
          letterSpacing: ".01em",
          textTransform: "none",
          fontFamily: "var(--ff-sans)",
        }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
