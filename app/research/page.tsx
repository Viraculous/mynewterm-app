"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TermShell,
  TermPanel,
  TermInput,
  TermButton,
} from "@/components/term";

type SchoolResearchResponse =
  | { ok: true; research: string }
  | { ok: false; error: string };
type OfstedResponse =
  | {
      ok: true;
      data: { rating?: string; source?: string; query?: string } & Record<
        string,
        unknown
      >;
    }
  | { ok: false; error: string };

type ResearchJson = {
  schoolName: string;
  overview?: {
    schoolType?: string;
    ageRange?: string;
    approxSize?: string;
    specialisms?: string[];
    notableStrengths?: string[];
  };
  ofsted?: { rating?: string; keyFindings?: string[] };
  scienceDepartment?: { reputation?: string; notes?: string[] };
  communityContext?: { intake?: string; contextNotes?: string[] };
  recentNews?: string[];
  talkingPoints?: string[];
  verificationNotes?: string[];
};

function ratingTag(rating: string): { tag: string; color: string } {
  const r = rating.toLowerCase();
  if (r.includes("outstanding"))
    return { tag: "[ OUTSTANDING ]", color: "var(--term-lime)" };
  if (r === "good" || r.includes(" good"))
    return { tag: "[ GOOD        ]", color: "var(--term-cyan)" };
  if (r.includes("requires improvement"))
    return { tag: "[ REQ. IMPROV ]", color: "var(--term-amber)" };
  if (r.includes("inadequate"))
    return { tag: "[ INADEQUATE  ]", color: "var(--term-red)" };
  if (r.includes("not yet inspected"))
    return { tag: "[ NOT INSPECT ]", color: "var(--term-text-muted)" };
  return { tag: `[ ${rating.toUpperCase().slice(0, 11).padEnd(11)} ]`, color: "var(--term-text-muted)" };
}

function toNotesString(r: ResearchJson) {
  const lines: string[] = [];
  lines.push(`School research notes for: ${r.schoolName}`);
  lines.push("");
  if (r.overview) {
    lines.push("Overview:");
    if (r.overview.schoolType) lines.push(`- Type: ${r.overview.schoolType}`);
    if (r.overview.ageRange) lines.push(`- Age range: ${r.overview.ageRange}`);
    if (r.overview.approxSize)
      lines.push(`- Approx size: ${r.overview.approxSize}`);
    if (r.overview.specialisms?.length)
      lines.push(`- Specialisms: ${r.overview.specialisms.join(", ")}`);
    if (r.overview.notableStrengths?.length)
      lines.push(`- Strengths: ${r.overview.notableStrengths.join("; ")}`);
    lines.push("");
  }
  if (r.ofsted) {
    lines.push("Ofsted (verify):");
    if (r.ofsted.rating) lines.push(`- Rating: ${r.ofsted.rating}`);
    if (r.ofsted.keyFindings?.length)
      lines.push(`- Key findings: ${r.ofsted.keyFindings.join("; ")}`);
    lines.push("");
  }
  if (r.scienceDepartment) {
    lines.push("Science department (verify):");
    if (r.scienceDepartment.reputation)
      lines.push(`- Reputation: ${r.scienceDepartment.reputation}`);
    if (r.scienceDepartment.notes?.length)
      lines.push(`- Notes: ${r.scienceDepartment.notes.join("; ")}`);
    lines.push("");
  }
  if (r.communityContext) {
    lines.push("Community context:");
    if (r.communityContext.intake)
      lines.push(`- Intake: ${r.communityContext.intake}`);
    if (r.communityContext.contextNotes?.length)
      lines.push(`- Notes: ${r.communityContext.contextNotes.join("; ")}`);
    lines.push("");
  }
  if (r.recentNews?.length) {
    lines.push("Recent news / developments (verify):");
    for (const n of r.recentNews) lines.push(`- ${n}`);
    lines.push("");
  }
  if (r.talkingPoints?.length) {
    lines.push("Suggested talking points:");
    for (const t of r.talkingPoints) lines.push(`- ${t}`);
    lines.push("");
  }
  if (r.verificationNotes?.length) {
    lines.push("Verification notes:");
    for (const v of r.verificationNotes) lines.push(`- ${v}`);
  }
  return lines.join("\n").trim();
}

export default function ResearchPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rawResearch, setRawResearch] = useState<string | null>(null);
  const [research, setResearch] = useState<ResearchJson | null>(null);
  const [ofsted, setOfsted] = useState<OfstedResponse | null>(null);

  const effectiveRating = useMemo(() => {
    const fromAI = research?.ofsted?.rating?.trim();
    const fromOfsted =
      ofsted && ofsted.ok && typeof ofsted.data.rating === "string"
        ? ofsted.data.rating.trim()
        : "";
    const aiLooksUseful = fromAI && fromAI.toLowerCase() !== "unknown";
    const extLooksUseful = fromOfsted && fromOfsted.toLowerCase() !== "unknown";
    if (extLooksUseful) return fromOfsted;
    if (aiLooksUseful) return fromAI;
    return fromAI || fromOfsted || "Unknown";
  }, [research, ofsted]);

  async function onSearch() {
    setError(null);
    setRawResearch(null);
    setResearch(null);
    setOfsted(null);

    const name = schoolName.trim();
    if (!name) {
      setError("Please enter a school name.");
      return;
    }

    setIsLoading(true);
    try {
      const [researchRes, ofstedRes] = await Promise.all([
        fetch("/api/school-research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolName: name }),
        }),
        fetch("/api/school-research/ofsted", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ schoolName: name }),
        }).catch(() => null),
      ]);

      const researchData = (await researchRes.json()) as SchoolResearchResponse;
      if (!researchRes.ok || !researchData.ok) {
        setError(!researchData.ok ? researchData.error : "Research request failed.");
        return;
      }

      setRawResearch(researchData.research);
      try {
        const parsed = JSON.parse(researchData.research) as ResearchJson;
        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.schoolName === "string"
        )
          setResearch(parsed);
      } catch {
        // fall back to raw string
      }

      if (ofstedRes) {
        const ofstedData = (await ofstedRes.json().catch(() => null)) as
          | OfstedResponse
          | null;
        if (ofstedData) setOfsted(ofstedData);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error while researching.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function onUseNotes() {
    if (!schoolName.trim()) return;

    const r: ResearchJson =
      research ??
      ({
        schoolName: schoolName.trim(),
        verificationNotes: [
          "Research output could not be parsed as JSON. Verify details manually.",
        ],
        talkingPoints: [],
      } satisfies ResearchJson);

    const notes = toNotesString(r);

    localStorage.setItem("schoolResearch.schoolName", r.schoolName);
    localStorage.setItem("schoolResearch.notes", notes);
    if (rawResearch) localStorage.setItem("schoolResearch.raw", rawResearch);

    router.push(`/apply?schoolName=${encodeURIComponent(r.schoolName)}`);
  }

  const ratingDisplay = ratingTag(effectiveRating || "Unknown");

  return (
    <TermShell prompt="./research">
      <div className="mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
          <span className="text-[var(--term-lime)]">{">"}</span> school research
        </h1>
        <div className="mt-1 text-sm text-[var(--term-text-muted)]">
          // research a school before applying
        </div>
      </div>

      <TermPanel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <TermInput
              id="researchSchool"
              label="school name"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. Greenfield Academy, Leeds"
              onKeyDown={(e) => {
                if (e.key === "Enter") void onSearch();
              }}
            />
          </div>
          <TermButton
            variant="primary"
            onClick={() => void onSearch()}
            disabled={isLoading}
          >
            {isLoading ? "[ searching… ]" : "[ search ]"}
          </TermButton>
        </div>
        {error ? (
          <p className="mt-3 text-xs text-red-300">// error: {error}</p>
        ) : null}
      </TermPanel>

      {isLoading ? (
        <p className="mt-4 text-sm text-[var(--term-text-muted)]">
          // researching school…
        </p>
      ) : null}

      {research ? (
        <div className="mt-6 space-y-5">
          <TermPanel title="school::overview">
            <div className="mb-3 flex items-center justify-end text-xs text-[var(--term-text-muted)]">
              {research.schoolName}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ["School type", research.overview?.schoolType || "Unknown"],
                ["Age range", research.overview?.ageRange || "Unknown"],
                ["Approx. size", research.overview?.approxSize || "Unknown"],
                [
                  "Specialisms",
                  research.overview?.specialisms?.length
                    ? research.overview.specialisms.join(", ")
                    : "Unknown",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="border border-[var(--term-border)] bg-black/40 p-3"
                >
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--term-text-comment)]">
                    // {label}
                  </div>
                  <div className="mt-1 text-sm text-white">{value}</div>
                </div>
              ))}
            </div>
          </TermPanel>

          <TermPanel title="ofsted::summary">
            <div className="mb-3 flex items-center justify-end">
              <span
                className="whitespace-pre text-[10px] font-bold tracking-tight"
                style={{ color: ratingDisplay.color }}
              >
                {ratingDisplay.tag}
              </span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--term-text)]">
              {(research.ofsted?.keyFindings?.length
                ? research.ofsted.keyFindings
                : ["No reliable key findings provided."]
              )
                .slice(0, 6)
                .map((x) => (
                  <li
                    key={x}
                    className="border border-[var(--term-border)] bg-black/40 p-3"
                  >
                    {x}
                  </li>
                ))}
            </ul>
            {ofsted && ofsted.ok ? (
              <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-[var(--term-text-comment)]">
                // external source attempt:{" "}
                {typeof ofsted.data.source === "string" ? ofsted.data.source : "Unknown"}
              </div>
            ) : null}
          </TermPanel>

          <TermPanel title="science::department">
            <div className="border border-[var(--term-border)] bg-black/40 p-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--term-text-comment)]">
                // reputation
              </div>
              <div className="mt-1 text-sm text-white">
                {research.scienceDepartment?.reputation || "Unknown"}
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-[var(--term-text)]">
              {(research.scienceDepartment?.notes?.length
                ? research.scienceDepartment.notes
                : ["No reliable science department notes provided."]
              )
                .slice(0, 8)
                .map((x) => (
                  <li
                    key={x}
                    className="border border-[var(--term-border)] bg-black/40 p-3"
                  >
                    {x}
                  </li>
                ))}
            </ul>
          </TermPanel>

          <TermPanel title="community::context">
            <div className="border border-[var(--term-border)] bg-black/40 p-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--term-text-comment)]">
                // typical intake
              </div>
              <div className="mt-1 text-sm text-white">
                {research.communityContext?.intake || "Unknown"}
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-[var(--term-text)]">
              {(research.communityContext?.contextNotes?.length
                ? research.communityContext.contextNotes
                : ["No reliable community context notes provided."]
              )
                .slice(0, 8)
                .map((x) => (
                  <li
                    key={x}
                    className="border border-[var(--term-border)] bg-black/40 p-3"
                  >
                    {x}
                  </li>
                ))}
            </ul>
          </TermPanel>

          <TermPanel title="talking::points">
            <ul className="space-y-2">
              {(research.talkingPoints?.length
                ? research.talkingPoints
                : ["No suggested talking points provided."]
              )
                .slice(0, 10)
                .map((x) => (
                  <li
                    key={x}
                    className="border border-cyan-400/30 bg-cyan-400/5 p-3 text-sm text-cyan-100"
                  >
                    {x}
                  </li>
                ))}
            </ul>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TermButton variant="primary" onClick={onUseNotes}>
                [ use notes in application ]
              </TermButton>
              {research.verificationNotes?.length ? (
                <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--term-text-comment)]">
                  // verify:{" "}
                  {research.verificationNotes.slice(0, 2).join(" ")}
                </div>
              ) : null}
            </div>
          </TermPanel>
        </div>
      ) : rawResearch ? (
        <div className="mt-6">
          <TermPanel title="research::raw">
            <pre className="whitespace-pre-wrap text-sm text-[var(--term-text)]">
              {rawResearch}
            </pre>
            <div className="mt-5">
              <TermButton variant="primary" onClick={onUseNotes}>
                [ use notes in application ]
              </TermButton>
            </div>
          </TermPanel>
        </div>
      ) : null}

      <div className="mt-10 text-[10px] uppercase tracking-[0.18em] text-[var(--term-text-comment)]">
        // ai-generated research may not be current — verify before your interview
      </div>
    </TermShell>
  );
}
