"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { slugify } from "@/lib/utils";
import { createVehicle, updateVehicle } from "./actions";
import { importAutohomePano } from "./import-pano-action";
import { uploadVehicleImage } from "./upload-action";
import { syncVehicleGallery } from "./sync-action";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

// Supabase JSONB columns are typed `Json` at the schema level. The admin
// form expects gallery as `string[]` and features as
// `Record<string, string[]>`, but a malformed import or an old row can
// surface other shapes (a bare string, a number, an object instead of an
// array). Coerce defensively so the form renders instead of throwing
// "x.join is not a function" out of useState.
function coerceGallery(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function coerceFeatures(v: unknown): Record<string, string[]> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string[]> = {};
  for (const [section, items] of Object.entries(v as Record<string, unknown>)) {
    if (Array.isArray(items)) {
      out[section] = items.filter((x): x is string => typeof x === "string");
    } else if (typeof items === "string" && items.trim()) {
      out[section] = [items];
    }
  }
  return out;
}

const BODIES: { value: NonNullable<Vehicle["body"]>; label: string }[] = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
  { value: "coupe", label: "Coupe" },
  { value: "wagon", label: "Wagon / Estate" },
  { value: "pickup", label: "Pickup" },
  { value: "mpv", label: "MPV / Minivan" },
  { value: "convertible", label: "Convertible" },
];

const DRIVE_TYPES: { value: NonNullable<Vehicle["drive_type"]>; label: string }[] = [
  { value: "fwd", label: "Front-wheel drive (FWD)" },
  { value: "rwd", label: "Rear-wheel drive (RWD)" },
  { value: "awd", label: "All-wheel drive (AWD)" },
  { value: "4wd", label: "Four-wheel drive (4WD)" },
];

export default function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const isEdit = !!vehicle;
  const [name, setName] = useState(vehicle?.name ?? "");
  const [slug, setSlug] = useState(vehicle?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [imageUrl, setImageUrl] = useState(vehicle?.image_url ?? "");
  // The generated Database types may not yet know about spin_frames /
  // pano_url (run `supabase gen types` to refresh). Cast for the read.
  const extras = vehicle as
    | (Vehicle & { spin_frames?: unknown; pano_url?: string | null })
    | undefined;
  const [gallery, setGallery] = useState<string[]>(() =>
    coerceGallery(vehicle?.gallery),
  );
  const [spinFrames, setSpinFrames] = useState<string[]>(() =>
    coerceGallery(extras?.spin_frames),
  );
  const [panoUrl, setPanoUrl] = useState(extras?.pano_url ?? "");
  const [features, setFeatures] = useState<{ section: string; items: string }[]>(
    () => {
      const f = coerceFeatures(vehicle?.features);
      const entries = Object.entries(f);
      if (entries.length === 0) return [];
      return entries.map(([section, items]) => ({
        section,
        items: items.join("\n"),
      }));
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Upload state — separate transitions for the cover and the gallery
  // so a gallery upload doesn't block typing in the cover field.
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [gallerySyncing, setGallerySyncing] = useState(false);
  const [galleryUrlDraft, setGalleryUrlDraft] = useState("");
  const [spinUploading, setSpinUploading] = useState(false);
  const [panoUploading, setPanoUploading] = useState(false);
  const [panoImporting, setPanoImporting] = useState(false);
  const [panoImportError, setPanoImportError] = useState<string | null>(null);
  const coverFileRef = useRef<HTMLInputElement | null>(null);
  const galleryFileRef = useRef<HTMLInputElement | null>(null);
  const spinFileRef = useRef<HTMLInputElement | null>(null);
  const panoFileRef = useRef<HTMLInputElement | null>(null);

  const onNameChange = (v: string) => {
    setName(v);
    if (!slugTouched && !isEdit) setSlug(slugify(v));
  };

  async function uploadFor(
    file: File,
    setter: (uploading: boolean) => void,
    apply: (url: string) => void,
  ) {
    if (!slug) {
      setError("Enter a slug first — uploads are stored under <slug>/<filename>.");
      return;
    }
    setError(null);
    setter(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slug", slug);
      const result = await uploadVehicleImage(fd);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      apply(result.url);
    } finally {
      setter(false);
    }
  }

  const onCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    void uploadFor(file, setCoverUploading, (url) => setImageUrl(url));
  };

  const onImportAutohomePano = () => {
    setPanoImportError(null);
    if (!slug) {
      setPanoImportError("Enter a slug first.");
      return;
    }
    const url = panoUrl.trim();
    if (!/^https?:\/\/pano\.autohome\.com\.cn\//i.test(url)) {
      setPanoImportError("Paste an autohome pano URL into this field, then click Import.");
      return;
    }
    setPanoImporting(true);
    (async () => {
      try {
        const result = await importAutohomePano({ url, slug });
        if ("error" in result) {
          setPanoImportError(result.error);
          return;
        }
        setPanoUrl(result.url);
      } finally {
        setPanoImporting(false);
      }
    })();
  };

  const onPanoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!slug) {
      setError("Enter a slug first — uploads are stored under <slug>/<filename>.");
      return;
    }
    setError(null);
    setPanoUploading(true);
    (async () => {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("slug", slug);
        fd.append("folder", "pano");
        const result = await uploadVehicleImage(fd);
        if ("error" in result) {
          setError(result.error);
          return;
        }
        setPanoUrl(result.url);
      } finally {
        setPanoUploading(false);
      }
    })();
  };

  const onSpinFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    if (!slug) {
      setError("Enter a slug first — uploads are stored under <slug>/<filename>.");
      return;
    }
    // Sort numerically by filename so 01.jpg, 02.jpg, … 10.jpg upload
    // in capture order even if the OS hands them back unordered.
    files.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    );
    setSpinUploading(true);
    setError(null);
    (async () => {
      const next = [...spinFrames];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("slug", slug);
        fd.append("folder", "spin");
        const result = await uploadVehicleImage(fd);
        if ("error" in result) {
          setError(result.error);
          break;
        }
        next.push(result.url);
      }
      setSpinFrames(next);
      setSpinUploading(false);
    })();
  };

  const removeSpinFrame = (idx: number) =>
    setSpinFrames((s) => s.filter((_, i) => i !== idx));
  const moveSpinFrame = (from: number, to: number) =>
    setSpinFrames((s) => {
      if (to < 0 || to >= s.length) return s;
      const next = [...s];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  const clearSpinFrames = () => setSpinFrames([]);

  const onGalleryFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setGalleryUploading(true);
    setError(null);
    (async () => {
      const next = [...gallery];
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("slug", slug);
        const result = await uploadVehicleImage(fd);
        if ("error" in result) {
          setError(result.error);
          break;
        }
        next.push(result.url);
      }
      setGallery(next);
      setGalleryUploading(false);
    })();
  };

  const removeGallery = (idx: number) =>
    setGallery((g) => g.filter((_, i) => i !== idx));

  const moveGallery = (from: number, to: number) =>
    setGallery((g) => {
      if (to < 0 || to >= g.length) return g;
      const next = [...g];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const setAsFeatured = (idx: number) => {
    const url = gallery[idx];
    if (!url) return;
    setImageUrl(url);
    setGallery((g) => g.filter((_, i) => i !== idx));
  };

  const addGalleryUrl = () => {
    const url = galleryUrlDraft.trim();
    if (!url) return;
    setGallery((g) => [...g, url]);
    setGalleryUrlDraft("");
  };

  const onSyncFromR2 = async () => {
    if (!isEdit || !vehicle) return;
    setError(null);
    setGallerySyncing(true);
    try {
      const result = await syncVehicleGallery(vehicle.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setGallery(result.gallery);
      if (result.imageUrlSet) setImageUrl(result.imageUrlSet);
    } finally {
      setGallerySyncing(false);
    }
  };

  const featuresAsObject = (): Record<string, string[]> => {
    const out: Record<string, string[]> = {};
    for (const { section, items } of features) {
      const sectionName = section.trim();
      if (!sectionName) continue;
      const list = items
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      if (list.length > 0) out[sectionName] = list;
    }
    return out;
  };

  const addFeatureSection = () =>
    setFeatures((f) => [...f, { section: "", items: "" }]);
  const removeFeatureSection = (idx: number) =>
    setFeatures((f) => f.filter((_, i) => i !== idx));
  const updateFeatureSection = (
    idx: number,
    patch: Partial<{ section: string; items: string }>,
  ) =>
    setFeatures((f) => f.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("gallery", JSON.stringify(gallery));
    formData.set("spin_frames", JSON.stringify(spinFrames));
    formData.set("pano_url", panoUrl);
    formData.set("features", JSON.stringify(featuresAsObject()));
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
        <label className="adm__label" htmlFor="brand">Brand</label>
        <input
          id="brand"
          name="brand"
          className="adm__input"
          defaultValue={vehicle?.brand ?? ""}
          placeholder="BYD, Denza, Avatr…"
        />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="model">Model</label>
        <input
          id="model"
          name="model"
          className="adm__input"
          defaultValue={vehicle?.model ?? ""}
          placeholder="Sealion 06, Tang L…"
        />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="trim">Trim</label>
        <input
          id="trim"
          name="trim"
          className="adm__input"
          defaultValue={vehicle?.trim ?? ""}
          placeholder="Pro extended range, Ultra…"
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
        <label className="adm__label" htmlFor="type">Power train</label>
        <select id="type" name="type" required className="adm__select" defaultValue={vehicle?.type ?? "ev"}>
          <option value="ev">Electric (EV)</option>
          <option value="reev">Range-Extended (REEV)</option>
          <option value="phev">Plug-in Hybrid (PHEV)</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="body">Body</label>
        <select id="body" name="body" className="adm__select" defaultValue={vehicle?.body ?? ""}>
          <option value="">— unspecified —</option>
          {BODIES.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="drive_type">Drive type</label>
        <select id="drive_type" name="drive_type" className="adm__select" defaultValue={vehicle?.drive_type ?? ""}>
          <option value="">— unspecified —</option>
          {DRIVE_TYPES.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
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
        <label className="adm__label" htmlFor="drivetrain">Drivetrain notes</label>
        <input
          id="drivetrain"
          name="drivetrain"
          className="adm__input"
          defaultValue={vehicle?.drivetrain ?? ""}
          placeholder="Free-form, e.g. '670 km · Pure EV'"
        />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="range_km">Range (km)</label>
        <input id="range_km" name="range_km" type="number" className="adm__input" defaultValue={vehicle?.range_km ?? ""} />
      </div>

      {/* Cover image — URL + upload */}
      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="image_url">Cover image URL</label>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "stretch", flexWrap: "wrap" }}>
          <input
            id="image_url"
            name="image_url"
            type="url"
            className="adm__input"
            style={{ flex: "1 1 320px", minWidth: 0 }}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.motolinkers.com/<slug>/cover.avif"
          />
          <input
            ref={coverFileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onCoverFile}
          />
          <button
            type="button"
            className="adm__btn adm__btn--ghost"
            disabled={coverUploading}
            onClick={() => coverFileRef.current?.click()}
          >
            {coverUploading ? "Uploading…" : "Upload"}
          </button>
        </div>
        {imageUrl && (
          <div className="adm__thumb-row" style={{ marginTop: ".6rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="adm__thumb adm__thumb--cover" />
          </div>
        )}
      </div>

      {/* Gallery */}
      <div className="adm__field adm__field--full">
        <label className="adm__label">Gallery</label>
        <p className="adm__sub" style={{ margin: "-.2rem 0 .6rem", fontSize: ".82rem" }}>
          Stored at{" "}
          <code style={{ fontFamily: "var(--ff-mono)" }}>
            https://images.motolinkers.com/{slug || "<slug>"}/…
          </code>
          . The first image gets a <em>Set as featured</em> shortcut that promotes it
          to the cover.
        </p>

        {gallery.length > 0 && (
          <div className="adm__gallery-grid">
            {gallery.map((url, i) => (
              <div key={`${url}-${i}`} className="adm__gallery-cell">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="adm__thumb" />
                <button
                  type="button"
                  className="adm__gallery-remove"
                  aria-label="Remove image"
                  onClick={() => removeGallery(i)}
                >
                  ×
                </button>
                <div className="adm__gallery-controls">
                  <button
                    type="button"
                    className="adm__gallery-mini"
                    aria-label="Move left"
                    disabled={i === 0}
                    onClick={() => moveGallery(i, i - 1)}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="adm__gallery-mini"
                    aria-label="Move right"
                    disabled={i === gallery.length - 1}
                    onClick={() => moveGallery(i, i + 1)}
                  >
                    →
                  </button>
                  {i === 0 && (
                    <button
                      type="button"
                      className="adm__gallery-mini adm__gallery-mini--accent"
                      onClick={() => setAsFeatured(i)}
                    >
                      ★ Set as featured
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem", flexWrap: "wrap" }}>
          <input
            type="url"
            placeholder="Add image URL"
            className="adm__input"
            style={{ flex: "1 1 320px", minWidth: 0 }}
            value={galleryUrlDraft}
            onChange={(e) => setGalleryUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addGalleryUrl();
              }
            }}
          />
          <button type="button" className="adm__btn adm__btn--ghost" onClick={addGalleryUrl}>
            Add URL
          </button>
          <input
            ref={galleryFileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={onGalleryFile}
          />
          <button
            type="button"
            className="adm__btn adm__btn--ghost"
            disabled={galleryUploading}
            onClick={() => galleryFileRef.current?.click()}
          >
            {galleryUploading ? "Uploading…" : "Upload images"}
          </button>
          {isEdit && (
            <button
              type="button"
              className="adm__btn adm__btn--ghost"
              disabled={gallerySyncing}
              onClick={onSyncFromR2}
              title={`List images under ${slug}/ in R2 and replace this gallery with the result.`}
            >
              {gallerySyncing ? "Syncing…" : "Sync from R2"}
            </button>
          )}
        </div>
      </div>

      {/* Spin frames (360°) */}
      <div className="adm__field adm__field--full">
        <label className="adm__label">Spin frames (360° exterior)</label>
        <p className="adm__sub" style={{ margin: "-.2rem 0 .6rem", fontSize: ".82rem" }}>
          Upload the OEM 360° image set — typically 36 frames. Files are
          sorted by filename, so name them <code>01.jpg</code>,{" "}
          <code>02.jpg</code>, … <code>36.jpg</code>. The 360° tab activates
          once there are at least 12 frames.
        </p>
        <p className="adm__sub" style={{ margin: "0 0 .6rem", fontSize: ".82rem" }}>
          {spinFrames.length} frame{spinFrames.length === 1 ? "" : "s"}
          {spinFrames.length >= 12
            ? " — 360° tab enabled"
            : spinFrames.length > 0
              ? ` — needs ≥ 12 to enable the 360° tab (${12 - spinFrames.length} more)`
              : ""}
        </p>

        {spinFrames.length > 0 && (
          <div className="adm__gallery-grid">
            {spinFrames.map((url, i) => (
              <div key={`${url}-${i}`} className="adm__gallery-cell">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="adm__thumb" />
                <button
                  type="button"
                  className="adm__gallery-remove"
                  aria-label="Remove frame"
                  onClick={() => removeSpinFrame(i)}
                >
                  ×
                </button>
                <div className="adm__gallery-controls">
                  <button
                    type="button"
                    className="adm__gallery-mini"
                    aria-label="Move left"
                    disabled={i === 0}
                    onClick={() => moveSpinFrame(i, i - 1)}
                  >
                    ←
                  </button>
                  <span style={{ fontFamily: "var(--ff-mono)", fontSize: ".7rem" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    className="adm__gallery-mini"
                    aria-label="Move right"
                    disabled={i === spinFrames.length - 1}
                    onClick={() => moveSpinFrame(i, i + 1)}
                  >
                    →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: ".5rem", marginTop: ".75rem", flexWrap: "wrap" }}>
          <input
            ref={spinFileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={onSpinFiles}
          />
          <button
            type="button"
            className="adm__btn adm__btn--ghost"
            disabled={spinUploading}
            onClick={() => spinFileRef.current?.click()}
          >
            {spinUploading ? "Uploading…" : "Upload frames"}
          </button>
          {spinFrames.length > 0 && (
            <button
              type="button"
              className="adm__btn adm__btn--danger"
              onClick={clearSpinFrames}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Interior pano */}
      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="pano_url">Interior pano URL</label>
        <p className="adm__sub" style={{ margin: "-.2rem 0 .6rem", fontSize: ".82rem" }}>
          Single equirectangular image (2:1 aspect ratio) for the interior
          panorama tab. Leave blank to hide the tab.
        </p>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "stretch", flexWrap: "wrap" }}>
          <input
            id="pano_url"
            type="url"
            className="adm__input"
            style={{ flex: "1 1 320px", minWidth: 0 }}
            value={panoUrl}
            onChange={(e) => setPanoUrl(e.target.value)}
            placeholder="https://images.motolinkers.com/<slug>/pano/interior.jpg"
          />
          <input
            ref={panoFileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onPanoFile}
          />
          <button
            type="button"
            className="adm__btn adm__btn--ghost"
            disabled={panoUploading}
            onClick={() => panoFileRef.current?.click()}
          >
            {panoUploading ? "Uploading…" : "Upload"}
          </button>
          <button
            type="button"
            className="adm__btn adm__btn--ghost"
            disabled={panoImporting}
            onClick={onImportAutohomePano}
            title="Paste an autohome.com.cn pano URL above, then click to convert it to an equirectangular image."
          >
            {panoImporting ? "Importing…" : "Import from autohome"}
          </button>
        </div>
        {panoImportError && (
          <p
            style={{
              marginTop: ".5rem",
              color: "var(--volt)",
              fontSize: ".82rem",
              fontFamily: "var(--ff-mono)",
            }}
          >
            {panoImportError}
          </p>
        )}
        {panoUrl && (
          <div className="adm__thumb-row" style={{ marginTop: ".6rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={panoUrl}
              alt=""
              className="adm__thumb adm__thumb--cover"
              crossOrigin="anonymous"
            />
          </div>
        )}
      </div>

      {/* Features */}
      <div className="adm__field adm__field--full">
        <label className="adm__label">Features</label>
        <p className="adm__sub" style={{ margin: "-.2rem 0 .6rem", fontSize: ".82rem" }}>
          Group features under a section header (e.g.{" "}
          <em>Driver assistance</em>, <em>Doors & access</em>). One feature per
          line in each section.
        </p>
        {features.length === 0 ? (
          <p className="adm__sub" style={{ marginBottom: ".6rem" }}>
            No features yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: ".75rem" }}>
            {features.map((row, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: ".85rem",
                  background: "var(--ink-3)",
                  display: "flex",
                  flexDirection: "column",
                  gap: ".55rem",
                }}
              >
                <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
                  <input
                    className="adm__input"
                    placeholder="Section name (e.g. Driver assistance)"
                    value={row.section}
                    onChange={(e) =>
                      updateFeatureSection(i, { section: e.target.value })
                    }
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="adm__btn adm__btn--danger"
                    onClick={() => removeFeatureSection(i)}
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  className="adm__textarea"
                  placeholder={"One feature per line\nLane keeping\nAdaptive cruise"}
                  rows={4}
                  value={row.items}
                  onChange={(e) =>
                    updateFeatureSection(i, { items: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          className="adm__btn adm__btn--ghost"
          style={{ marginTop: ".75rem" }}
          onClick={addFeatureSection}
        >
          + Add section
        </button>
      </div>

      <label className="adm__checkbox">
        <input type="checkbox" name="is_featured" defaultChecked={vehicle?.is_featured ?? false} />
        Featured on home
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
