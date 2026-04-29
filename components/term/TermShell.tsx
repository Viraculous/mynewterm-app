import type { ReactNode } from "react";

export function TermShell({
  prompt,
  children,
}: {
  prompt: string;
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          "radial-gradient(rgba(34,211,238,0.08) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="mx-auto max-w-[1100px] px-5 py-8 md:px-6 md:py-12">
        <div className="mb-6 flex flex-wrap items-baseline gap-3 border-b border-[var(--term-border)] pb-3">
          <span className="text-sm text-[var(--term-cyan)]">user@mynewterm</span>
          <span className="text-sm text-[var(--term-text-muted)]">~</span>
          <span className="text-sm text-[var(--term-text-muted)]">$</span>
          <span className="text-sm font-bold text-[var(--term-lime)]">
            {prompt}
          </span>
          <span
            className="ml-1 inline-block h-4 w-2 bg-[var(--term-lime)]"
            style={{ animation: "blink 1s steps(2) infinite" }}
            aria-hidden="true"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
