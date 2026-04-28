"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteLead } from "./actions";

export default function DeleteButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const onClick = () => {
    if (!window.confirm(`Delete lead from "${label}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteLead(id);
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
