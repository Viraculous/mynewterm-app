import type { ReactNode } from "react";

export function TermTable({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border border-[var(--term-border-strong)] bg-black/40 ${className}`}
    >
      {children}
    </div>
  );
}

export function TermTableHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border-b border-[var(--term-border)] bg-cyan-400/5 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-cyan-400/70 ${className}`}
    >
      {children}
    </div>
  );
}

export function TermTableRow({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`border-b border-cyan-400/10 px-4 py-3 transition-colors last:border-b-0 hover:bg-cyan-400/5 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
