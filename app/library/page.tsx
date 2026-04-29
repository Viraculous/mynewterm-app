"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  TermShell,
  TermPanel,
  TermInput,
  TermButton,
} from "@/components/term";

type StatementRow = {
  id: number;
  title: string;
  school_name: string | null;
  role_type: string | null;
  statement_text: string;
  word_count: number | null;
  date_saved: string | null;
  tags: string | null;
};

type GetStatementsResponse =
  | { ok: true; statements: StatementRow[] }
  | { ok: false; error: string };

function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function parseTags(tags: string | null) {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export default function LibraryPage() {
  const [statements, setStatements] = useState<StatementRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/statements");
        const data = (await res.json()) as GetStatementsResponse;
        if (!res.ok || !data.ok) {
          const msg = !data.ok ? data.error : "Failed to load statements.";
          throw new Error(msg);
        }
        if (!cancelled) setStatements(data.statements);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load statements.";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return statements;
    return statements.filter((s) => {
      const hay = [s.title, s.school_name ?? "", s.tags ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, statements]);

  async function onCopy(id: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1200);
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  async function onDelete(id: number) {
    const ok = window.confirm(
      "Delete this saved statement? This cannot be undone.",
    );
    if (!ok) return;

    setError(null);
    const prev = statements;
    setStatements((s) => s.filter((x) => x.id !== id));

    try {
      const res = await fetch(`/api/statements/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !data || data.ok !== true) {
        const msg =
          data && typeof data.error === "string" ? data.error : "Delete failed.";
        throw new Error(msg);
      }
    } catch (e) {
      setStatements(prev);
      const msg = e instanceof Error ? e.message : "Delete failed.";
      setError(msg);
    }
  }

  return (
    <TermShell prompt="./library">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
            <span className="text-[var(--term-lime)]">{">"}</span> library
          </h1>
          <div className="mt-1 text-sm text-[var(--term-text-muted)]">
            // your saved personal statements
          </div>
        </div>
        <Link href="/apply">
          <TermButton variant="primary">[+] generate new</TermButton>
        </Link>
      </div>

      <div className="mt-6">
        <TermInput
          id="librarySearch"
          label="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, school name, or tags…"
        />
      </div>

      {error ? (
        <p className="mt-4 text-xs text-red-300">// error: {error}</p>
      ) : null}

      {isLoading ? (
        <div className="mt-8 text-sm text-[var(--term-text-muted)]">
          // loading statements…
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8">
          <TermPanel>
            <div className="text-sm text-[var(--term-text-muted)]">
              // no statements saved yet
            </div>
          </TermPanel>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4">
          {filtered.map((s) => {
            const isExpanded = !!expanded[s.id];
            const tags = parseTags(s.tags);
            return (
              <TermPanel key={s.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-base font-bold text-white">
                      {s.title}
                    </div>
                    <div className="mt-1 text-xs text-[var(--term-text-muted)]">
                      {(s.school_name || "—") + " · " + (s.role_type || "—")}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-[var(--term-border)] bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--term-lime)]">
                      [ {(s.word_count ?? 0).toLocaleString()} words ]
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--term-text-muted)]">
                      {formatDate(s.date_saved)}
                    </span>
                  </div>
                </div>

                {tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="border border-cyan-400/25 bg-cyan-400/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                ) : null}

                {isExpanded ? (
                  <div className="mt-4 border border-[var(--term-border)] bg-black/40 p-3 text-[13px] leading-relaxed whitespace-pre-wrap text-[var(--term-text)]">
                    {s.statement_text}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <TermButton
                    variant="secondary"
                    onClick={() =>
                      setExpanded((m) => ({ ...m, [s.id]: !m[s.id] }))
                    }
                  >
                    {isExpanded ? "[ hide ]" : "[ view ]"}
                  </TermButton>
                  <TermButton
                    variant="secondary"
                    onClick={() => void onCopy(s.id, s.statement_text)}
                  >
                    {copiedId === s.id ? "[ copied ]" : "[ copy ]"}
                  </TermButton>
                  <TermButton variant="danger" onClick={() => void onDelete(s.id)}>
                    [ delete ]
                  </TermButton>
                </div>
              </TermPanel>
            );
          })}
        </div>
      )}
    </TermShell>
  );
}
