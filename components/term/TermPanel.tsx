import type { ReactNode } from "react";

export function TermPanel({
  title,
  children,
  padded = true,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  padded?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`border border-[var(--term-border-strong)] bg-black/40 ${className}`}
    >
      {title ? (
        <div className="border-b border-[var(--term-border)] bg-cyan-400/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">
          ▸ {title}
        </div>
      ) : null}
      <div className={padded ? "p-4 md:p-5" : ""}>{children}</div>
    </div>
  );
}
