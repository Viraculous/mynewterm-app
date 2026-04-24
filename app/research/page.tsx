"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SchoolResearchResponse = { ok: true; research: string } | { ok: false; error: string };
type OfstedResponse =
  | { ok: true; data: { rating?: string; source?: string; query?: string } & Record<string, unknown> }
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

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function ratingColor(rating: string) {
  const r = rating.toLowerCase();
  if (r.includes("outstanding")) return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
  if (r === "good" || r.includes(" good")) return "bg-sky-500/15 text-sky-200 border-sky-500/30";
  if (r.includes("requires improvement")) return "bg-yellow-500/15 text-yellow-200 border-yellow-500/30";
  if (r.includes("inadequate")) return "bg-rose-500/15 text-rose-200 border-rose-500/30";
  if (r.includes("not yet inspected")) return "bg-slate-500/15 text-slate-200 border-slate-500/30";
  return "bg-slate-500/10 text-slate-200 border-slate-500/20";
}

function toNotesString(r: ResearchJson) {
  const lines: string[] = [];
  lines.push(`School research notes for: ${r.schoolName}`);
  lines.push("");
  if (r.overview) {
    lines.push("Overview:");
    if (r.overview.schoolType) lines.push(`- Type: ${r.overview.schoolType}`);
    if (r.overview.ageRange) lines.push(`- Age range: ${r.overview.ageRange}`);
    if (r.overview.approxSize) lines.push(`- Approx size: ${r.overview.approxSize}`);
    if (r.overview.specialisms?.length) lines.push(`- Specialisms: ${r.overview.specialisms.join(", ")}`);
    if (r.overview.notableStrengths?.length) lines.push(`- Strengths: ${r.overview.notableStrengths.join("; ")}`);
    lines.push("");
  }
  if (r.ofsted) {
    lines.push("Ofsted (verify):");
    if (r.ofsted.rating) lines.push(`- Rating: ${r.ofsted.rating}`);
    if (r.ofsted.keyFindings?.length) lines.push(`- Key findings: ${r.ofsted.keyFindings.join("; ")}`);
    lines.push("");
  }
  if (r.scienceDepartment) {
    lines.push("Science department (verify):");
    if (r.scienceDepartment.reputation) lines.push(`- Reputation: ${r.scienceDepartment.reputation}`);
    if (r.scienceDepartment.notes?.length) lines.push(`- Notes: ${r.scienceDepartment.notes.join("; ")}`);
    lines.push("");
  }
  if (r.communityContext) {
    lines.push("Community context:");
    if (r.communityContext.intake) lines.push(`- Intake: ${r.communityContext.intake}`);
    if (r.communityContext.contextNotes?.length) lines.push(`- Notes: ${r.communityContext.contextNotes.join("; ")}`);
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
      ofsted && ofsted.ok && typeof ofsted.data.rating === "string" ? ofsted.data.rating.trim() : "";
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
        if (parsed && typeof parsed === "object" && typeof parsed.schoolName === "string") setResearch(parsed);
      } catch {
        // fall back to raw string
      }

      if (ofstedRes) {
        const ofstedData = (await ofstedRes.json().catch(() => null)) as OfstedResponse | null;
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
        verificationNotes: ["Research output could not be parsed as JSON. Verify details manually."],
        talkingPoints: [],
      } satisfies ResearchJson);

    const notes = toNotesString(r);

    localStorage.setItem("schoolResearch.schoolName", r.schoolName);
    localStorage.setItem("schoolResearch.notes", notes);
    if (rawResearch) localStorage.setItem("schoolResearch.raw", rawResearch);

    router.push(`/apply?schoolName=${encodeURIComponent(r.schoolName)}`);
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-slate-100">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">School Research</h1>
          <p className="mt-2 text-sm text-slate-300">Research a school before applying</p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none ring-0 transition focus:border-slate-600"
              placeholder="Enter school name e.g. Greenfield Academy, Leeds"
              onKeyDown={(e) => {
                if (e.key === "Enter") void onSearch();
              }}
            />
            <button
              type="button"
              onClick={() => void onSearch()}
              disabled={isLoading}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Researching school..." : "Search"}
            </button>
          </div>

          {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
        </div>

        {isLoading ? <p className="text-sm text-slate-300">Researching school...</p> : null}

        {research ? (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-200">School Overview</h2>
                <div className="text-xs text-slate-500">{research.schoolName}</div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="text-xs text-slate-400">School type</div>
                  <div className="mt-1 text-sm text-slate-100">{research.overview?.schoolType || "Unknown"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="text-xs text-slate-400">Age range</div>
                  <div className="mt-1 text-sm text-slate-100">{research.overview?.ageRange || "Unknown"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="text-xs text-slate-400">Approx. size</div>
                  <div className="mt-1 text-sm text-slate-100">{research.overview?.approxSize || "Unknown"}</div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="text-xs text-slate-400">Specialisms</div>
                  <div className="mt-1 text-sm text-slate-100">
                    {research.overview?.specialisms?.length ? research.overview.specialisms.join(", ") : "Unknown"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-200">Ofsted Summary</h2>
                <span className={classNames("rounded-full border px-3 py-1 text-xs font-semibold", ratingColor(effectiveRating))}>
                  {effectiveRating || "Unknown"}
                </span>
              </div>

              <ul className="space-y-2 text-sm text-slate-200">
                {(research.ofsted?.keyFindings?.length ? research.ofsted.keyFindings : ["No reliable key findings provided."])
                  .slice(0, 6)
                  .map((x) => (
                    <li key={x} className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      {x}
                    </li>
                  ))}
              </ul>

              {ofsted && ofsted.ok ? (
                <div className="mt-3 text-xs text-slate-500">
                  External source attempt: {typeof ofsted.data.source === "string" ? ofsted.data.source : "Unknown"}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <h2 className="mb-3 text-base font-semibold text-slate-200">Science Department</h2>
              <div className="text-sm text-slate-200">
                <div className="mb-2 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="text-xs text-slate-400">Reputation</div>
                  <div className="mt-1">{research.scienceDepartment?.reputation || "Unknown"}</div>
                </div>
                <ul className="space-y-2">
                  {(research.scienceDepartment?.notes?.length ? research.scienceDepartment.notes : ["No reliable science department notes provided."])
                    .slice(0, 8)
                    .map((x) => (
                      <li key={x} className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                        {x}
                      </li>
                    ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <h2 className="mb-3 text-base font-semibold text-slate-200">Community Context</h2>
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-200">
                <div className="text-xs text-slate-400">Typical intake</div>
                <div className="mt-1">{research.communityContext?.intake || "Unknown"}</div>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-200">
                {(research.communityContext?.contextNotes?.length ? research.communityContext.contextNotes : ["No reliable community context notes provided."])
                  .slice(0, 8)
                  .map((x) => (
                    <li key={x} className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
                      {x}
                    </li>
                  ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <h2 className="mb-3 text-base font-semibold text-slate-200">Talking Points</h2>
              <ul className="space-y-2">
                {(research.talkingPoints?.length ? research.talkingPoints : ["No suggested talking points provided."])
                  .slice(0, 10)
                  .map((x) => (
                    <li
                      key={x}
                      className="rounded-xl border border-blue-500/25 bg-blue-500/10 p-3 text-sm text-blue-100"
                    >
                      {x}
                    </li>
                  ))}
              </ul>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={onUseNotes}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400"
                >
                  Use These Notes in Application
                </button>
                {research.verificationNotes?.length ? (
                  <div className="text-xs text-slate-500">
                    <div className="font-semibold text-slate-400">Verify:</div>
                    <div>{research.verificationNotes.slice(0, 2).join(" ")}</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : rawResearch ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
            <h2 className="mb-2 text-base font-semibold text-slate-200">Research</h2>
            <pre className="whitespace-pre-wrap text-sm text-slate-200">{rawResearch}</pre>
            <div className="mt-5">
              <button
                type="button"
                onClick={onUseNotes}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400"
              >
                Use These Notes in Application
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-10 text-xs text-slate-500">
          AI-generated research may not be current or fully accurate. Always verify key facts before your interview.
        </div>
      </div>
    </div>
  );
}

