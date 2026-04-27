import type { ReactNode } from "react";

export default function Label({ children }: { children: ReactNode }) {
  return <span className="label">{children}</span>;
}
