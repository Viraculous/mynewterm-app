"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function parseTags(tags: string | null) {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function tagColor(tag: string) {
  const colors = [
    "bg-sky-500/15 text-sky-200 border-sky-500/25",
    "bg-emerald-500/15 text-emerald-200 border-emerald-500/25",
    "bg-violet-500/15 text-violet-200 border-violet-500/25",
    "bg-amber-500/15 text-amber-200 border-amber-500/25",
    "bg-rose-500/15 text-rose-200 border-rose-500/25",
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length];
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
      const hay = [
        s.title,
        s.school_name ?? "",
        s.tags ?? "",
      ]
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
    const ok = window.confirm("Delete this saved statement? This cannot be undone.");
    if (!ok) return;

    setError(null);
    const prev = statements;
    setStatements((s) => s.filter((x) => x.id !== id));

    try {
      const res = await fetch(`/api/statements/${id}`, { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data || data.ok !== true) {
        const msg = data && typeof data.error === "string" ? data.error : "Delete failed.";
        throw new Error(msg);
      }
    } catch (e) {
      setStatements(prev);
      const msg = e instanceof Error ? e.message : "Delete failed.";
      setError(msg);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Statement Library</h1>
            <p className="mt-2 text-sm text-slate-300">Your saved personal statements</p>
          </div>

          <Link
            href="/apply"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400"
          >
            Generate New Statement
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-slate-600"
            placeholder="Search by title, school name, or tags..."
          />
        </div>

        {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}

        {isLoading ? (
          <div className="mt-8 text-sm text-slate-300">Loading statements...</div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-300">
            No statements saved yet
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4">
            {filtered.map((s) => {
              const isExpanded = !!expanded[s.id];
              const tags = parseTags(s.tags);
              return (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-slate-100">{s.title}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {(s.school_name || "—") + " · " + (s.role_type || "—")}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-xs font-semibold text-slate-200">
                        {(s.word_count ?? 0).toLocaleString()} words
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(s.date_saved)}</span>
                    </div>
                  </div>

                  {tags.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className={[
                            "rounded-full border px-2.5 py-1 text-xs font-semibold",
                            tagColor(t),
                          ].join(" ")}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {isExpanded ? (
                    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                      {s.statement_text}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => setExpanded((m) => ({ ...m, [s.id]: !m[s.id] }))}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/40 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                    >
                      {isExpanded ? "Hide" : "View"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onCopy(s.id, s.statement_text)}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/40 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                    >
                      {copiedId === s.id ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void onDelete(s.id)}
                      className="inline-flex items-center justify-center rounded-xl border border-rose-700/60 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:border-rose-500/80 hover:bg-rose-500/15"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

