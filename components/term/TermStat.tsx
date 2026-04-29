export function TermStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  const display =
    typeof value === "number" ? String(value).padStart(2, "0") : value;
  return (
    <div className="border border-[var(--term-border-strong)] bg-black/40 p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80">
        ▸ {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[10px] text-gray-500">[</span>
        <span className="text-3xl font-bold text-[var(--term-lime)]">
          {display}
        </span>
        <span className="text-[10px] text-gray-500">]</span>
      </div>
    </div>
  );
}
