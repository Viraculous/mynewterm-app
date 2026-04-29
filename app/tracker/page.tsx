"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  TermShell,
  TermPanel,
  TermButton,
  TermStatusTag,
  TermSelect,
} from "@/components/term";

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

const STATUSES = [
  "Drafting",
  "Submitted",
  "Interview",
  "Offer",
  "Unsuccessful",
  "Withdrawn",
] as const;

export default function TrackerPage() {
  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

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

  const filtered = useMemo(() => {
    if (!filterStatus) return apps;
    return apps.filter((a) => a.status === filterStatus);
  }, [apps, filterStatus]);

  async function updateStatus(id: number, status: string) {
    const prev = apps;
    setApps((cur) => cur.map((a) => (a.id === id ? { ...a, status } : a)));
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Update failed (${res.status})`);
      const updated = (await res.json()) as ApplicationRow;
      setApps((cur) => cur.map((a) => (a.id === id ? updated : a)));
    } catch {
      setApps(prev);
    }
  }

  return (
    <TermShell prompt="./tracker">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
            <span className="text-[var(--term-lime)]">{">"}</span> tracker
          </h1>
          <div className="mt-1 text-sm text-[var(--term-text-muted)]">
            // applications, deadlines, and statements
          </div>
        </div>
        <Link href="/apply">
          <TermButton variant="primary">[+] new application</TermButton>
        </Link>
      </div>

      <div className="mt-6">
        <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[var(--term-text-comment)]">
          // filter
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterPill
            active={filterStatus === null}
            onClick={() => setFilterStatus(null)}
          >
            all
          </FilterPill>
          {STATUSES.map((s) => (
            <FilterPill
              key={s}
              active={filterStatus === s}
              onClick={() => setFilterStatus(s)}
            >
              {s.toLowerCase()}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <TermPanel padded={false}>
          {loading ? (
            <div className="px-4 py-4 text-sm text-[var(--term-text-muted)]">
              // loading…
            </div>
          ) : error ? (
            <div className="px-4 py-4 text-sm text-red-300">
              <span className="font-bold">// error: </span>
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-4 py-4 text-sm text-[var(--term-text-muted)]">
              // no applications match this filter
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-cyan-400/5">
                    <Th>school</Th>
                    <Th>role</Th>
                    <Th>closing</Th>
                    <Th>status</Th>
                    <Th className="w-[220px]">actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const expanded = expandedId === a.id;
                    return (
                      <Fragment key={a.id}>
                        <tr className="border-t border-cyan-400/10 align-top transition-colors hover:bg-cyan-400/5">
                          <Td>
                            <div className="font-bold text-white">
                              {a.school_name}
                            </div>
                          </Td>
                          <Td>
                            <div className="text-[var(--term-text)]">
                              {a.role_title}
                            </div>
                          </Td>
                          <Td>
                            <div className="text-[var(--term-text-muted)]">
                              {a.closing_date?.trim() ? a.closing_date : "—"}
                            </div>
                          </Td>
                          <Td>
                            <div className="flex flex-wrap items-center gap-2">
                              <TermStatusTag status={a.status} />
                              <TermSelect
                                value={a.status}
                                onChange={(e) =>
                                  void updateStatus(a.id, e.target.value)
                                }
                                aria-label={`Status for ${a.school_name}`}
                                className="w-auto py-1 text-xs"
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </TermSelect>
                            </div>
                          </Td>
                          <Td>
                            <TermButton
                              variant="secondary"
                              onClick={() =>
                                setExpandedId((cur) =>
                                  cur === a.id ? null : a.id,
                                )
                              }
                            >
                              {expanded ? "[hide]" : "[view statement]"}
                            </TermButton>
                          </Td>
                        </tr>

                        {expanded ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="border-t border-cyan-400/10 bg-black/40 p-4"
                            >
                              <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-[var(--term-text-comment)]">
                                // personal statement
                              </div>
                              <div className="border border-[var(--term-border)] bg-black/40 p-3 text-[13px] leading-relaxed whitespace-pre-wrap text-[var(--term-text)]">
                                {a.personal_statement?.trim()
                                  ? a.personal_statement
                                  : "// no statement saved yet"}
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TermPanel>
      </div>
    </TermShell>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`whitespace-nowrap border-b border-[var(--term-border)] px-4 py-2 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/70 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top">{children}</td>;
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] transition-colors",
        active
          ? "border-[var(--term-lime)] bg-cyan-400/10 text-white"
          : "border-[var(--term-border)] bg-transparent text-[var(--term-text-muted)] hover:border-[var(--term-border-strong)] hover:text-cyan-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
