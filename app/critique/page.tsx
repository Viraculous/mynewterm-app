"use client";

import { useMemo, useState } from "react";

type Rating = "Strong" | "Good" | "Weak" | "Missing";

type StandardKey = "TS1" | "TS2" | "TS3" | "TS4" | "TS5" | "TS6" | "TS7" | "TS8" | "Safeguarding";

type StandardCritique = { rating: Rating; feedback: string };

type CritiqueJson = {
  overallScore: number;
  overallSummary: string;
  standards: Record<StandardKey, StandardCritique>;
  strengths: [string, string, string] | string[];
  improvements: { suggestion: string; exampleRewrite: string }[];
  revisedOpeningParagraph: string;
};

type CritiqueResponse = { ok: true; critique: string } | { ok: false; error: string };

const STANDARD_LABELS: Record<StandardKey, string> = {
  TS1: "TS1 — Set high expectations",
  TS2: "TS2 — Promote good progress",
  TS3: "TS3 — Subject & curriculum knowledge",
  TS4: "TS4 — Plan & teach well-structured lessons",
  TS5: "TS5 — Adapt teaching to pupils’ needs",
  TS6: "TS6 — Use assessment productively",
  TS7: "TS7 — Manage behaviour effectively",
  TS8: "TS8 — Wider professional responsibilities",
  Safeguarding: "Safeguarding awareness",
};

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, value));
}

function scoreColor(score: number) {
  if (score >= 8) return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30";
  if (score >= 6) return "bg-amber-500/15 text-amber-300 ring-amber-400/30";
  return "bg-rose-500/15 text-rose-300 ring-rose-400/30";
}

function ratingColor(rating: Rating) {
  switch (rating) {
    case "Strong":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30";
    case "Good":
      return "bg-sky-500/15 text-sky-300 ring-sky-400/30";
    case "Weak":
      return "bg-amber-500/15 text-amber-300 ring-amber-400/30";
    case "Missing":
      return "bg-rose-500/15 text-rose-300 ring-rose-400/30";
    default:
      return "bg-slate-500/15 text-slate-300 ring-slate-400/30";
  }
}

function stripCodeFences(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  // Remove leading ```json? and trailing ```
  return trimmed.replace(/^```[a-zA-Z]*\s*/m, "").replace(/```$/m, "").trim();
}

function safeParseCritique(text: string): { ok: true; value: CritiqueJson } | { ok: false; error: string } {
  const cleaned = stripCodeFences(text);
  try {
    const parsed = JSON.parse(cleaned) as CritiqueJson;
    if (!parsed || typeof parsed !== "object") return { ok: false, error: "Critique response was not valid JSON." };
    if (typeof parsed.overallScore !== "number") return { ok: false, error: "Critique JSON missing overallScore." };
    if (typeof parsed.overallSummary !== "string") return { ok: false, error: "Critique JSON missing overallSummary." };
    if (!parsed.standards || typeof parsed.standards !== "object") return { ok: false, error: "Critique JSON missing standards." };
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: "Could not parse critique JSON. Try again." };
  }
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function CritiquePage() {
  const [statement, setStatement] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [critiqueRaw, setCritiqueRaw] = useState<string | null>(null);
  const [critique, setCritique] = useState<CritiqueJson | null>(null);

  const [copied, setCopied] = useState(false);

  const computedScore = useMemo(() => (critique ? clampScore(critique.overallScore) : null), [critique]);

  async function onAnalyse() {
    setError(null);
    setCritique(null);
    setCritiqueRaw(null);
    setCopied(false);

    if (!statement.trim()) {
      setError("Please paste your personal statement first.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/critique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statement: statement.trim(),
          jobDescription: jobDescription.trim() ? jobDescription.trim() : undefined,
        }),
      });

      const data = (await res.json()) as CritiqueResponse;
      if (!res.ok || !data.ok) {
        setError(!data.ok ? data.error : "Analysis failed.");
        return;
      }

      setCritiqueRaw(data.critique);
      const parsed = safeParseCritique(data.critique);
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }

      setCritique(parsed.value);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error while analysing.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function onCopyOpening() {
    if (!critique?.revisedOpeningParagraph) return;
    try {
      await navigator.clipboard.writeText(critique.revisedOpeningParagraph);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy to clipboard. Please copy manually.");
    }
  }

  const standardOrder: StandardKey[] = ["TS1", "TS2", "TS3", "TS4", "TS5", "TS6", "TS7", "TS8", "Safeguarding"];

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Statement Critique</h1>
          <p className="mt-2 text-sm text-slate-300">
            Review your personal statement against the Teachers Standards
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Personal Statement <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              required
              rows={12}
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-slate-600"
              placeholder="Paste your personal statement here..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Job Description <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-slate-600"
              placeholder="Paste the job description for more targeted feedback..."
            />
          </div>

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onAnalyse}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Analysing your statement..." : "Analyse Statement"}
            </button>
          </div>
        </div>

        {critique ? (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={[
                    "inline-flex h-16 w-16 items-center justify-center rounded-2xl ring-1",
                    scoreColor(computedScore ?? 0),
                  ].join(" ")}
                >
                  <div className="text-center">
                    <div className="text-xl font-bold">{(computedScore ?? 0).toFixed(1).replace(/\.0$/, "")}</div>
                    <div className="text-xs opacity-80">/10</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-200">Overall</div>
                  <div className="text-xs text-slate-400">Based on Teachers’ Standards + safeguarding</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-indigo-500/10 p-5 ring-1 ring-indigo-400/20">
              <div className="text-sm font-semibold text-indigo-200">Summary</div>
              <p className="mt-2 text-sm text-slate-200">{critique.overallSummary}</p>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-slate-200">Teachers’ Standards</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {standardOrder.map((key) => {
                  const item = critique.standards?.[key];
                  const rating = item?.rating ?? "Missing";
                  const feedback = item?.feedback ?? "No feedback returned.";
                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-semibold text-slate-100">{STANDARD_LABELS[key]}</div>
                        <span
                          className={[
                            "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                            ratingColor(rating),
                          ].join(" ")}
                        >
                          {rating}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{feedback}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                <div className="text-sm font-semibold text-slate-200">Strengths</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  {(Array.isArray(critique.strengths) ? critique.strengths : []).slice(0, 3).map((s, i) => (
                    <li key={`${i}-${s}`} className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-300">
                        <CheckIcon />
                      </span>
                      <span className="text-slate-200">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                <div className="text-sm font-semibold text-slate-200">Improvements</div>
                <div className="mt-3 space-y-4">
                  {(critique.improvements ?? []).slice(0, 3).map((imp, i) => (
                    <div key={`${i}-${imp.suggestion}`} className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                      <div className="text-sm font-semibold text-slate-100">{imp.suggestion}</div>
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-slate-400">Example rewrite</div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">{imp.exampleRewrite}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-200">Suggested Opening Paragraph</div>
                  <div className="text-xs text-slate-500">Use this as a stronger, more targeted start.</div>
                </div>
                <button
                  type="button"
                  onClick={onCopyOpening}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                <p className="whitespace-pre-wrap text-sm text-slate-200">{critique.revisedOpeningParagraph}</p>
              </div>
            </div>

            {critiqueRaw && !critique ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                <div className="text-sm font-semibold text-slate-200">Raw critique</div>
                <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-xs text-slate-200">
                  {critiqueRaw}
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

