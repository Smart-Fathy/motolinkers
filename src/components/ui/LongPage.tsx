import type { ReactNode } from "react";
import Label from "@/components/ui/Label";

export default function LongPage({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <main style={{ paddingTop: "9rem", paddingBottom: "var(--sp-section)" }}>
      <div className="wrap" style={{ maxWidth: 820 }}>
        <Label>{kicker}</Label>
        <h1
          style={{
            fontFamily: "var(--ff-display)",
            fontWeight: 300,
            fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)",
            lineHeight: 0.95,
            letterSpacing: "-.035em",
            fontVariationSettings: '"opsz" 144, "SOFT" 50',
            color: "var(--bone)",
            margin: "0 0 2.5rem",
            maxWidth: "20ch",
          }}
        >
          {title}
        </h1>
        <div
          style={{
            color: "var(--bone)",
            opacity: 0.82,
            fontSize: "1.05rem",
            lineHeight: 1.65,
          }}
          className="long-prose"
        >
          {children}
        </div>
      </div>
    </main>
  );
}
