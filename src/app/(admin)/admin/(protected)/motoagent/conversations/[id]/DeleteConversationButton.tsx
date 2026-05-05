"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMotoagentConversation } from "../../actions";

export default function DeleteConversationButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm("Delete this conversation? This can't be undone.")) return;
    startTransition(async () => {
      const res = await deleteMotoagentConversation(id);
      if (!res.ok) {
        alert(res.error);
        return;
      }
      router.push("/admin/motoagent/conversations");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className="adm__btn adm__btn--ghost"
      onClick={onClick}
      disabled={pending}
      style={{ color: "#e87b7b" }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
