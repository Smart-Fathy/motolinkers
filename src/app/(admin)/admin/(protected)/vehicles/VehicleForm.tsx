"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { slugify } from "@/lib/utils";
import { createVehicle, updateVehicle } from "./actions";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

export default function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const isEdit = !!vehicle;
  const [name, setName] = useState(vehicle?.name ?? "");
  const [slug, setSlug] = useState(vehicle?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onNameChange = (v: string) => {
    setName(v);
    if (!slugTouched && !isEdit) setSlug(slugify(v));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = isEdit
        ? await updateVehicle(vehicle!.id, formData)
        : await createVehicle(formData);
      if (result && "error" in result) setError(result.error);
    });
  };

  return (
    <form className="adm__form" onSubmit={onSubmit}>
      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          required
          className="adm__input"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="slug">Slug</label>
        <input
          id="slug"
          name="slug"
          required
          className="adm__input"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTouched(true);
          }}
        />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="origin">Origin</label>
        <select id="origin" name="origin" required className="adm__select" defaultValue={vehicle?.origin ?? "cn"}>
          <option value="cn">China (cn)</option>
          <option value="ae">UAE (ae)</option>
        </select>
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="type">Type</label>
        <select id="type" name="type" required className="adm__select" defaultValue={vehicle?.type ?? "ev"}>
          <option value="ev">Electric (EV)</option>
          <option value="reev">Range-Extended (REEV)</option>
          <option value="phev">Plug-in Hybrid (PHEV)</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="year">Year</label>
        <input id="year" name="year" type="number" required className="adm__input" defaultValue={vehicle?.year ?? new Date().getFullYear()} />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="price_egp">Price (EGP)</label>
        <input id="price_egp" name="price_egp" type="number" required className="adm__input" defaultValue={vehicle?.price_egp ?? ""} />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="price_usd">Price (USD)</label>
        <input id="price_usd" name="price_usd" type="number" className="adm__input" defaultValue={vehicle?.price_usd ?? ""} />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="transmission">Transmission</label>
        <input id="transmission" name="transmission" className="adm__input" defaultValue={vehicle?.transmission ?? ""} />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="drivetrain">Drivetrain</label>
        <input id="drivetrain" name="drivetrain" className="adm__input" defaultValue={vehicle?.drivetrain ?? ""} />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="range_km">Range (km)</label>
        <input id="range_km" name="range_km" type="number" className="adm__input" defaultValue={vehicle?.range_km ?? ""} />
      </div>
      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="image_url">Image URL</label>
        <input id="image_url" name="image_url" type="url" className="adm__input" defaultValue={vehicle?.image_url ?? ""} placeholder="https://images.motolinkers.com/…" />
      </div>
      <label className="adm__checkbox">
        <input type="checkbox" name="is_featured" defaultChecked={vehicle?.is_featured ?? false} />
        Featured
      </label>
      <label className="adm__checkbox">
        <input type="checkbox" name="is_published" defaultChecked={vehicle?.is_published ?? true} />
        Published
      </label>
      {error && <div className="adm__error adm__field--full">{error}</div>}
      <div className="adm__form-actions">
        <button type="submit" className="adm__btn adm__btn--primary" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create vehicle"}
        </button>
        <Link href="/admin/vehicles" className="adm__btn adm__btn--ghost">Cancel</Link>
      </div>
    </form>
  );
}
