"use client";

import { useEffect, useRef, type ElementType, type ReactNode, type CSSProperties } from "react";

interface Props {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
  threshold?: number;
}

export default function RevealStagger({
  as: Tag = "div",
  className,
  children,
  style,
  threshold = 0.12,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  const cls = `reveal-stagger${className ? ` ${className}` : ""}`;
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={cls} style={style}>
      {children}
    </Tag>
  );
}
