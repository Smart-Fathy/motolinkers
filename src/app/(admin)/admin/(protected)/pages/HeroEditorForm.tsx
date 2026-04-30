"use client";

import { useRef, useState, useTransition } from "react";
import { updatePageHero } from "./actions";
import { uploadPageImage } from "./upload-action";

type Hero = {
  page_slug: string;
  image_url: string | null;
  alt: string | null;
  height_vh: number;
  border_radius_px: number;
  opacity: number;
  overlay_color: string;
  overlay_opacity: number;
  is_enabled: boolean;
};

export default function HeroEditorForm({ hero }: { hero: Hero }) {
  const [imageUrl, setImageUrl] = useState(hero.image_url ?? "");
  const [alt, setAlt] = useState(hero.alt ?? "");
  const [heightVh, setHeightVh] = useState(hero.height_vh);
  const [radius, setRadius] = useState(hero.border_radius_px);
  const [opacity, setOpacity] = useState(hero.opacity);
  const [overlayColor, setOverlayColor] = useState(hero.overlay_color);
  const [overlayOpacity, setOverlayOpacity] = useState(hero.overlay_opacity);
  const [isEnabled, setIsEnabled] = useState(hero.is_enabled);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("page_slug", hero.page_slug);
      const result = await uploadPageImage(fd);
      if (!result.ok) setError(result.error);
      else setImageUrl(result.url);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const fd = new FormData(e.currentTarget);
    fd.set("page_slug", hero.page_slug);
    fd.set("opacity", String(opacity));
    fd.set("overlay_opacity", String(overlayOpacity));
    startTransition(async () => {
      const result = await updatePageHero(fd);
      if (!result.ok) setError(result.error);
      else setSuccess(true);
    });
  }

  return (
    <form className="adm__form" onSubmit={onSubmit}>
      <div className="adm__field adm__field--full">
        <label className="adm__label">Hero image</label>
        <div style={{ display: "flex", gap: ".7rem", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            name="image_url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.motolinkers.com/pages/<slug>/…"
            className="adm__input"
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
        {imageUrl && (
          <div
            style={{
              marginTop: ".8rem",
              borderRadius: 12,
              overflow: "hidden",
              aspectRatio: "16 / 7",
              backgroundImage: `url("${encodeURI(imageUrl)}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "1px solid var(--line)",
            }}
          />
        )}
      </div>

      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="alt">Alt text</label>
        <input
          id="alt"
          name="alt"
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          className="adm__input"
          placeholder="Brief description for screen readers"
        />
      </div>

      <div className="adm__field">
        <label className="adm__label" htmlFor="height_vh">
          Height ({heightVh} vh)
        </label>
        <input
          id="height_vh"
          name="height_vh"
          type="range"
          min={20}
          max={100}
          value={heightVh}
          onChange={(e) => setHeightVh(Number(e.target.value))}
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
          Image opacity ({opacity.toFixed(2)})
        </label>
        <input
          id="opacity"
          type="range"
          min={0.05}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          className="adm__input"
        />
      </div>

      <div className="adm__field">
        <label className="adm__label" htmlFor="overlay_color">Overlay colour</label>
        <input
          id="overlay_color"
          name="overlay_color"
          type="color"
          value={overlayColor}
          onChange={(e) => setOverlayColor(e.target.value)}
          className="adm__input"
          style={{ height: 44 }}
        />
      </div>

      <div className="adm__field">
        <label className="adm__label" htmlFor="overlay_opacity">
          Overlay opacity ({overlayOpacity.toFixed(2)})
        </label>
        <input
          id="overlay_opacity"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={overlayOpacity}
          onChange={(e) => setOverlayOpacity(Number(e.target.value))}
          className="adm__input"
        />
      </div>

      <div className="adm__field adm__field--full">
        <label className="adm__checkbox">
          <input
            type="checkbox"
            name="is_enabled"
            checked={isEnabled}
            onChange={(e) => setIsEnabled(e.target.checked)}
          />
          <span>Show this hero on the public page</span>
        </label>
      </div>

      {error && <div className="adm__error adm__field--full">{error}</div>}
      {success && (
        <div
          className="adm__field--full"
          style={{
            padding: ".75rem 1rem",
            borderRadius: 10,
            background: "rgba(201,168,76,.10)",
            border: "1px solid rgba(201,168,76,.3)",
            color: "var(--volt)",
            fontSize: ".9rem",
          }}
        >
          Saved.
        </div>
      )}

      <div className="adm__form-actions">
        <button type="submit" className="adm__btn adm__btn--primary" disabled={pending}>
          {pending ? "Saving…" : "Save hero"}
        </button>
      </div>
    </form>
  );
}
