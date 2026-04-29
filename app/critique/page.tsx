"use client";

import { useMemo, useState } from "react";
import {
  TermShell,
  TermPanel,
  TermTextarea,
  TermButton,
} from "@/components/term";

type Rating = "Strong" | "Good" | "Weak" | "Missing";

type StandardKey =
  | "TS1"
  | "TS2"
  | "TS3"
  | "TS4"
  | "TS5"
  | "TS6"
  | "TS7"
  | "TS8"
  | "Safeguarding";

type StandardCritique = { rating: Rating; feedback: string };

type CritiqueJson = {
  overallScore: number;
  overallSummary: string;
  standards: Record<StandardKey, StandardCritique>;
  strengths: [string, string, string] | string[];
  improvements: { suggestion: string; exampleRewrite: string }[];
  revisedOpeningParagraph: string;
};

type CritiqueResponse =
  | { ok: true; critique: string }
  | { ok: false; error: string };

const STANDARD_LABELS: Record<StandardKey, string> = {
  TS1: "TS1 — Set high expectations",
  TS2: "TS2 — Promote good progress",
  TS3: "TS3 — Subject & curriculum knowledge",
  TS4: "TS4 — Plan & teach well-structured lessons",
  TS5: "TS5 — Adapt teaching to pupils' needs",
  TS6: "TS6 — Use assessment productively",
  TS7: "TS7 — Manage behaviour effectively",
  TS8: "TS8 — Wider professional responsibilities",
  Safeguarding: "Safeguarding awareness",
};

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, value));
}

function scoreColor(score: number): string {
  if (score >= 8) return "var(--term-lime)";
  if (score >= 6) return "var(--term-amber)";
  return "var(--term-red)";
}

function ratingTag(rating: Rating): { tag: string; color: string } {
  switch (rating) {
    case "Strong":
      return { tag: "[ STRONG  ]", color: "var(--term-lime)" };
    case "Good":
      return { tag: "[ GOOD    ]", color: "var(--term-cyan)" };
    case "Weak":
      return { tag: "[ WEAK    ]", color: "var(--term-amber)" };
    case "Missing":
      return { tag: "[ MISSING ]", color: "var(--term-red)" };
    default:
      return { tag: "[ ???     ]", color: "var(--term-text-muted)" };
  }
}

function stripCodeFences(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```[a-zA-Z]*\s*/m, "")
    .replace(/```$/m, "")
    .trim();
}

function safeParseCritique(
  text: string,
):
  | { ok: true; value: CritiqueJson }
  | { ok: false; error: string } {
  const cleaned = stripCodeFences(text);
  try {
    const parsed = JSON.parse(cleaned) as CritiqueJson;
    if (!parsed || typeof parsed !== "object")
      return { ok: false, error: "Critique response was not valid JSON." };
    if (typeof parsed.overallScore !== "number")
      return { ok: false, error: "Critique JSON missing overallScore." };
    if (typeof parsed.overallSummary !== "string")
      return { ok: false, error: "Critique JSON missing overallSummary." };
    if (!parsed.standards || typeof parsed.standards !== "object")
      return { ok: false, error: "Critique JSON missing standards." };
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: "Could not parse critique JSON. Try again." };
  }
}

export default function CritiquePage() {
  const [statement, setStatement] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [critiqueRaw, setCritiqueRaw] = useState<string | null>(null);
  const [critique, setCritique] = useState<CritiqueJson | null>(null);

  const [copied, setCopied] = useState(false);

  const computedScore = useMemo(
    () => (critique ? clampScore(critique.overallScore) : null),
    [critique],
  );

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
          jobDescription: jobDescription.trim()
            ? jobDescription.trim()
            : undefined,
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

  const standardOrder: StandardKey[] = [
    "TS1",
    "TS2",
    "TS3",
    "TS4",
    "TS5",
    "TS6",
    "TS7",
    "TS8",
    "Safeguarding",
  ];

  return (
    <TermShell prompt="./critique">
      <div className="mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
          <span className="text-[var(--term-lime)]">{">"}</span> statement critique
        </h1>
        <div className="mt-1 text-sm text-[var(--term-text-muted)]">
          // review your statement against the Teachers&apos; Standards
        </div>
      </div>

      <TermPanel title="critique::input">
        <div className="space-y-5">
          <TermTextarea
            id="critiqueStatement"
            label={<>Personal Statement <span className="text-red-400">*</span></>}
            rows={12}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            required
            placeholder="Paste your personal statement here…"
          />
          <TermTextarea
            id="critiqueJob"
            label="Job Description"
            hint="optional · for more targeted feedback"
            rows={8}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description for more targeted feedback…"
          />

          {error ? (
            <p className="text-xs text-red-300">// error: {error}</p>
          ) : null}

          <div>
            <TermButton
              variant="primary"
              onClick={onAnalyse}
              disabled={isLoading}
            >
              {isLoading ? "[ analysing… ]" : "[+] analyse statement"}
            </TermButton>
          </div>
        </div>
      </TermPanel>

      {critique ? (
        <div className="mt-6 space-y-5">
          <TermPanel>
            <div className="flex items-center gap-5">
              <div
                className="flex h-20 w-20 shrink-0 flex-col items-center justify-center border-2 bg-black/40"
                style={{ borderColor: scoreColor(computedScore ?? 0) }}
              >
                <div
                  className="text-2xl font-bold leading-none"
                  style={{ color: scoreColor(computedScore ?? 0) }}
                >
                  {(computedScore ?? 0).toFixed(1).replace(/\.0$/, "")}
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-[var(--term-text-muted)]">
                  / 10
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--term-text-comment)]">
                  // overall::score
                </div>
                <div className="mt-1 text-sm font-bold text-white">Overall</div>
                <div className="mt-0.5 text-xs text-[var(--term-text-muted)]">
                  Based on Teachers&apos; Standards + safeguarding
                </div>
              </div>
            </div>
          </TermPanel>

          <TermPanel title="summary">
            <p className="text-sm leading-relaxed text-[var(--term-text)]">
              {critique.overallSummary}
            </p>
          </TermPanel>

          <div>
            <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[var(--term-text-comment)]">
              // teachers&apos; standards
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {standardOrder.map((key) => {
                const item = critique.standards?.[key];
                const rating = item?.rating ?? "Missing";
                const feedback = item?.feedback ?? "No feedback returned.";
                const r = ratingTag(rating);
                return (
                  <div
                    key={key}
                    className="border border-[var(--term-border-strong)] bg-black/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-bold text-white">
                        {STANDARD_LABELS[key]}
                      </div>
                      <span
                        className="shrink-0 whitespace-pre text-[10px] font-bold tracking-tight"
                        style={{ color: r.color }}
                      >
                        {r.tag}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--term-text)]">
                      {feedback}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TermPanel title="strengths">
              <ul className="space-y-2 text-sm text-[var(--term-text)]">
                {(Array.isArray(critique.strengths) ? critique.strengths : [])
                  .slice(0, 3)
                  .map((s, i) => (
                    <li key={`${i}-${s}`} className="flex items-start gap-2">
                      <span className="mt-0.5 text-[var(--term-lime)]">+</span>
                      <span>{s}</span>
                    </li>
                  ))}
              </ul>
            </TermPanel>

            <TermPanel title="improvements">
              <div className="space-y-3">
                {(critique.improvements ?? []).slice(0, 3).map((imp, i) => (
                  <div
                    key={`${i}-${imp.suggestion}`}
                    className="border border-[var(--term-border)] bg-black/40 p-3"
                  >
                    <div className="text-sm font-bold text-white">
                      {imp.suggestion}
                    </div>
                    <div className="mt-2">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--term-text-comment)]">
                        // example rewrite
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--term-text)]">
                        {imp.exampleRewrite}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TermPanel>
          </div>

          <TermPanel title="suggested::opening">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--term-text-comment)]">
                // a stronger, more targeted start
              </div>
              <TermButton variant="secondary" onClick={onCopyOpening}>
                {copied ? "[ copied ]" : "[ copy ]"}
              </TermButton>
            </div>
            <div className="mt-3 border border-[var(--term-border)] bg-black/40 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--term-text)]">
                {critique.revisedOpeningParagraph}
              </p>
            </div>
          </TermPanel>

          {critiqueRaw && !critique ? (
            <TermPanel title="critique::raw">
              <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-[var(--term-text)]">
                {critiqueRaw}
              </pre>
            </TermPanel>
          ) : null}
        </div>
      ) : null}
    </TermShell>
  );
}
