"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { slugify } from "@/lib/utils";
import { createNews, updateNews } from "./actions";

type News = Database["public"]["Tables"]["news"]["Row"];

const isoToDateInput = (iso: string | null) =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "";

export default function NewsForm({ article }: { article?: News }) {
  const isEdit = !!article;
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onTitleChange = (v: string) => {
    setTitle(v);
    if (!slugTouched && !isEdit) setSlug(slugify(v));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = isEdit
        ? await updateNews(article!.id, formData)
        : await createNews(formData);
      if (result && "error" in result) setError(result.error);
    });
  };

  return (
    <form className="adm__form" onSubmit={onSubmit}>
      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          required
          className="adm__input"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>
      <div className="adm__field adm__field--full">
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
      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="excerpt">Excerpt</label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={3}
          className="adm__textarea"
          defaultValue={article?.excerpt ?? ""}
        />
      </div>
      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="body_md">Body (Markdown)</label>
        <textarea
          id="body_md"
          name="body_md"
          rows={12}
          required
          className="adm__textarea"
          defaultValue={article?.body_md ?? ""}
        />
      </div>
      <div className="adm__field adm__field--full">
        <label className="adm__label" htmlFor="cover_image_url">Cover image URL</label>
        <input
          id="cover_image_url"
          name="cover_image_url"
          type="url"
          className="adm__input"
          defaultValue={article?.cover_image_url ?? ""}
          placeholder="https://images.motolinkers.com/…"
        />
      </div>
      <div className="adm__field">
        <label className="adm__label" htmlFor="published_at">Published date</label>
        <input
          id="published_at"
          name="published_at"
          type="date"
          className="adm__input"
          defaultValue={isoToDateInput(article?.published_at ?? null)}
        />
      </div>
      <label className="adm__checkbox">
        <input type="checkbox" name="is_published" defaultChecked={article?.is_published ?? true} />
        Published
      </label>
      {error && <div className="adm__error adm__field--full">{error}</div>}
      <div className="adm__form-actions">
        <button type="submit" className="adm__btn adm__btn--primary" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create article"}
        </button>
        <Link href="/admin/news" className="adm__btn adm__btn--ghost">Cancel</Link>
      </div>
    </form>
  );
}
