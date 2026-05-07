"use client";

import { useEffect, useRef, useState } from "react";

interface PanoViewerProps {
  url: string;
}

export default function PanoViewer({ url }: PanoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let viewer: { destroy: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const [{ Viewer }] = await Promise.all([
          import("@photo-sphere-viewer/core"),
          import("@photo-sphere-viewer/core/index.css"),
        ]);
        if (cancelled) return;
        viewer = new Viewer({
          container,
          panorama: url,
          navbar: ["zoom", "fullscreen"],
          defaultYaw: 0,
          defaultPitch: 0,
        });
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load panorama");
        }
      }
    })();

    return () => {
      cancelled = true;
      viewer?.destroy();
    };
  }, [url]);

  return (
    <div className="pano">
      <div ref={containerRef} className="pano__stage" />
      {error ? <div className="pano__error">{error}</div> : null}
    </div>
  );
}
