export type TermStatus =
  | "Drafting"
  | "Submitted"
  | "Interview"
  | "Offer"
  | "Unsuccessful"
  | "Withdrawn";

const STATUS_CONFIG: Record<TermStatus, { tag: string; color: string }> = {
  Drafting:     { tag: "[ DRAFTING.. ]", color: "var(--term-amber)" },
  Submitted:    { tag: "[ SUBMITTED  ]", color: "var(--term-cyan)" },
  Interview:    { tag: "[ INTERVIEW  ]", color: "var(--term-green)" },
  Offer:        { tag: "[ OFFER ★    ]", color: "var(--term-lime)" },
  Unsuccessful: { tag: "[ UNSUCCESS  ]", color: "var(--term-red)" },
  Withdrawn:    { tag: "[ WITHDRAWN  ]", color: "#CBD5E1" },
};

function fallbackTag(status: string): string {
  const trimmed = status.toUpperCase().slice(0, 10);
  return `[ ${trimmed.padEnd(10, " ")} ]`;
}

export function TermStatusTag({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as TermStatus];
  const tag = config?.tag ?? fallbackTag(status);
  const color = config?.color ?? "var(--term-text-muted)";
  return (
    <span
      className="whitespace-pre text-[10px] font-bold tracking-tight"
      style={{ color }}
    >
      {tag}
    </span>
  );
}
