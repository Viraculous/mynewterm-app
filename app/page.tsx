"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useState } from "react";

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

function badgeStyles(status: string): CSSProperties {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  switch (status) {
    case "Drafting":
      return {
        ...base,
        color: "#FDE68A",
        background: "rgba(245,158,11,0.15)",
        borderColor: "rgba(245,158,11,0.35)",
      };
    case "Submitted":
      return {
        ...base,
        color: "#93C5FD",
        background: "rgba(59,130,246,0.15)",
        borderColor: "rgba(59,130,246,0.35)",
      };
    case "Interview":
      return {
        ...base,
        color: "#86EFAC",
        background: "rgba(34,197,94,0.15)",
        borderColor: "rgba(34,197,94,0.35)",
      };
    case "Offer":
      return {
        ...base,
        color: "#6EE7B7",
        background: "rgba(16,185,129,0.15)",
        borderColor: "rgba(16,185,129,0.35)",
      };
    case "Unsuccessful":
      return {
        ...base,
        color: "#FCA5A5",
        background: "rgba(239,68,68,0.15)",
        borderColor: "rgba(239,68,68,0.35)",
      };
    case "Withdrawn":
      return {
        ...base,
        color: "#CBD5E1",
        background: "rgba(148,163,184,0.14)",
        borderColor: "rgba(148,163,184,0.30)",
      };
    default:
      return {
        ...base,
        color: "#E5E7EB",
        background: "rgba(255,255,255,0.08)",
        borderColor: "rgba(255,255,255,0.15)",
      };
  }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 16,
        padding: 16,
        minHeight: 88,
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(229,231,235,0.70)", fontWeight: 800 }}>
        {label}
      </div>
      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
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
    const closingThisWeek = apps.filter((a) => (a.closing_date ? isWithinNextDays(a.closing_date, 7) : false)).length;
    const statementsReady = apps.filter((a) => Boolean(a.personal_statement && a.personal_statement.trim().length > 0)).length;
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
    <div style={{ minHeight: "100vh", background: "#0A0F1E", color: "#E5E7EB" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 18px 60px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 14,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
              Welcome to MyNewTerm Helper
            </h1>
            <div style={{ marginTop: 6, color: "rgba(229,231,235,0.75)", fontSize: 13 }}>
              Track applications, deadlines, and statement progress.
            </div>
          </div>

          <Link
            href="/apply"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "11px 14px",
              borderRadius: 14,
              background: "rgba(59,130,246,0.20)",
              color: "#E5E7EB",
              border: "1px solid rgba(59,130,246,0.35)",
              textDecoration: "none",
              fontWeight: 750,
            }}
          >
            Start New Application
          </Link>
        </div>

        {error ? (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.12)",
              color: "#FCA5A5",
              fontWeight: 650,
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }}>
          <StatCard label="Total Applications" value={stats.total} />
          <StatCard label="Interviews" value={stats.interviews} />
          <StatCard label="Closing This Week" value={stats.closingThisWeek} />
          <StatCard label="Statements Ready" value={stats.statementsReady} />
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>
              Recent Applications
            </h2>
            <Link href="/tracker" style={{ color: "rgba(147,197,253,0.95)", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
              View Tracker
            </Link>
          </div>

          <div
            style={{
              marginTop: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {loading ? (
              <div style={{ padding: 16, color: "rgba(229,231,235,0.8)" }}>Loading…</div>
            ) : recent.length === 0 ? (
              <div style={{ padding: 16, color: "rgba(229,231,235,0.8)" }}>
                No applications yet.{" "}
                <Link href="/apply" style={{ color: "rgba(147,197,253,0.95)", textDecoration: "none", fontWeight: 700 }}>
                  Start your first one
                </Link>
                .
              </div>
            ) : (
              <div>
                {recent.map((a, idx) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 14px",
                      borderTop: idx === 0 ? "none" : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: "rgba(229,231,235,0.95)" }}>{a.school_name}</div>
                      <div style={{ marginTop: 3, fontSize: 13, color: "rgba(229,231,235,0.72)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.role_title}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <span style={badgeStyles(a.status)}>{a.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
