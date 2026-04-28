"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { syncAllGalleries } from "./sync-action";

export default function SyncAllButton() {
  const [pending, startTransition] = useTransition();
  const [banner, setBanner] = useState<
    | { kind: "ok"; vehicles: number; images: number }
    | { kind: "error"; message: string }
    | null
  >(null);
  const router = useRouter();

  const onClick = () => {
    if (
      !window.confirm(
        "Sync galleries for every vehicle from R2? This will overwrite each vehicle's gallery with the contents of its R2 folder.",
      )
    ) {
      return;
    }
    setBanner(null);
    startTransition(async () => {
      const result = await syncAllGalleries();
      if ("error" in result) {
        setBanner({ kind: "error", message: result.error });
        return;
      }
      setBanner({
        kind: "ok",
        vehicles: result.vehiclesProcessed,
        images: result.totalImages,
      });
      router.refresh();
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        className="adm__btn adm__btn--ghost"
        disabled={pending}
      >
        {pending ? "Syncing…" : "Sync all from R2"}
      </button>
      {banner?.kind === "ok" && (
        <span
          className="adm__pill adm__pill--on"
          style={{ marginLeft: ".5rem" }}
        >
          Synced {banner.vehicles} vehicle{banner.vehicles === 1 ? "" : "s"} ·{" "}
          {banner.images} image{banner.images === 1 ? "" : "s"}
        </span>
      )}
      {banner?.kind === "error" && (
        <span
          className="adm__pill adm__pill--off"
          style={{ marginLeft: ".5rem" }}
          title={banner.message}
        >
          Sync failed
        </span>
      )}
    </>
  );
}
