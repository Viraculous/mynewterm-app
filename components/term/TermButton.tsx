import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "border-lime-400/50 bg-lime-400/10 text-[var(--term-lime)] hover:bg-lime-400/20",
  secondary:
    "border-cyan-400/40 bg-transparent text-cyan-300 hover:bg-cyan-400/10",
  danger:
    "border-red-400/50 bg-red-400/10 text-red-300 hover:bg-red-400/20",
  ghost:
    "border-transparent bg-transparent text-[var(--term-text-muted)] hover:text-white",
};

export function TermButton({
  variant = "primary",
  className = "",
  type,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type ?? "button"}
      className={[
        "border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
