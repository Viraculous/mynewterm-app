"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TermShell, TermStat, TermPanel, TermStatusTag, TermButton } from "@/components/term";

type ApplicationRow = {
  id: number;
  school_name: string;
  role_title: string;
  job_description: string | null;
  school_notes: string | null;
  personal_statement: string | null;
  status: string;
  closing_date: string | null;
  date_added: string | null;
  updated_at: string | null;
};

function isWithinNextDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return d >= start && d <= end;
}

export default function DashboardHomePage() {
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/applications", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = (await res.json()) as ApplicationRow[];
      setApps(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const stats = useMemo(() => {
    const total = apps.length;
    const interviews = apps.filter((a) => a.status === "Interview").length;
    const closingThisWeek = apps.filter((a) =>
      a.closing_date ? isWithinNextDays(a.closing_date, 7) : false,
    ).length;
    const statementsReady = apps.filter((a) =>
      Boolean(a.personal_statement && a.personal_statement.trim().length > 0),
    ).length;
    return { total, interviews, closingThisWeek, statementsReady };
  }, [apps]);

  const recent = useMemo(() => {
    const copy = [...apps];
    copy.sort((a, b) => {
      const ad = a.updated_at ?? a.date_added ?? "";
      const bd = b.updated_at ?? b.date_added ?? "";
      const at = Date.parse(ad);
      const bt = Date.parse(bd);
      if (Number.isFinite(at) && Number.isFinite(bt)) return bt - at;
      if (Number.isFinite(at)) return -1;
      if (Number.isFinite(bt)) return 1;
      return (b.id ?? 0) - (a.id ?? 0);
    });
    return copy.slice(0, 3);
  }, [apps]);

  return (
    <TermShell prompt="./dashboard">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
            <span className="text-[var(--term-lime)]">{">"}</span> dashboard
          </h1>
          <div className="mt-1 text-sm text-[var(--term-text-muted)]">
            // tracking applications, deadlines, and statement progress
          </div>
        </div>
        <Link href="/apply">
          <TermButton variant="primary">[+] new application</TermButton>
        </Link>
      </div>

      {error ? (
        <div className="mt-6 border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          <span className="font-bold">// error: </span>
          {error}
        </div>
      ) : null}

      <div className="mt-8">
        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[var(--term-text-comment)]">
          // metrics
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TermStat label="Total" value={stats.total} />
          <TermStat label="Interviews" value={stats.interviews} />
          <TermStat label="Closing/7d" value={stats.closingThisWeek} />
          <TermStat label="Statements" value={stats.statementsReady} />
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-3 flex items-baseline justify-between border-b border-[var(--term-border)] pb-2">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            ▸ recent::applications
          </h2>
          <Link
            href="/tracker"
            className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--term-lime)] hover:underline"
          >
            [view tracker]
          </Link>
        </div>
        <TermPanel padded={false}>
          {loading ? (
            <div className="px-4 py-4 text-sm text-[var(--term-text-muted)]">
              // loading…
            </div>
          ) : recent.length === 0 ? (
            <div className="px-4 py-4 text-sm text-[var(--term-text-muted)]">
              // no applications yet —{" "}
              <Link
                href="/apply"
                className="text-[var(--term-lime)] hover:underline"
              >
                start your first one
              </Link>
            </div>
          ) : (
            <div>
              {recent.map((a, idx) => (
                <div
                  key={a.id}
                  className={`flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-cyan-400/5 ${
                    idx > 0 ? "border-t border-cyan-400/10" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate font-bold text-white">
                      {a.school_name}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-[var(--term-text-muted)]">
                      {a.role_title}
                    </div>
                  </div>
                  <TermStatusTag status={a.status} />
                </div>
              ))}
            </div>
          )}
        </TermPanel>
      </div>
    </TermShell>
  );
}
