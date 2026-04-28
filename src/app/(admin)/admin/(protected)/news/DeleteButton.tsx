"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteNews } from "./actions";

export default function DeleteButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = () => {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteNews(id);
      if (result?.error) {
        window.alert(`Delete failed: ${result.error}`);
        return;
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="adm__btn adm__btn--danger"
      disabled={pending}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
