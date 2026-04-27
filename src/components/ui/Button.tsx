import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
  withArrow?: "diagonal" | "right" | false;
}

type AnchorProps = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { as?: "a" };
type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { as: "button" };

type Props = AnchorProps | ButtonProps;

function ArrowDiagonal() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M7 17L17 7M17 7H9M17 7v8" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function Button(props: Props) {
  const { variant = "primary", children, withArrow = false, className, ...rest } = props as Props & {
    className?: string;
  };
  const cls = `btn btn--${variant}${className ? ` ${className}` : ""}`;
  const arrow =
    withArrow === "diagonal" ? <ArrowDiagonal /> : withArrow === "right" ? <ArrowRight /> : null;

  if ("as" in props && props.as === "button") {
    const { as: _as, ...btn } = rest as ButtonProps;
    void _as;
    return (
      <button {...(btn as ButtonHTMLAttributes<HTMLButtonElement>)} className={cls} data-hover>
        {children}
        {arrow}
      </button>
    );
  }

  const { as: _as, ...anchor } = rest as AnchorProps;
  void _as;
  return (
    <a {...(anchor as AnchorHTMLAttributes<HTMLAnchorElement>)} className={cls} data-hover>
      {children}
      {arrow}
    </a>
  );
}
