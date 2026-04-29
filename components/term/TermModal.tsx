"use client";

import { useEffect, type ReactNode } from "react";

export function TermModal({
  open,
  onClose,
  title,
  children,
  maxWidthClass = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidthClass?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-16"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full ${maxWidthClass} border border-[var(--term-border-focus)] bg-[var(--term-bg)]`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-[var(--term-border)] bg-cyan-400/5 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">
          <span>
            <span className="text-[var(--term-lime)]">{">"}</span> {title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-cyan-300/70 transition-colors hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-4 md:p-5">{children}</div>
      </div>
    </div>
  );
}
