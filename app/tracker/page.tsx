"use client";

import Link from "next/link";
import { Fragment, type CSSProperties, useEffect, useMemo, useState } from "react";

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

function badgeStyles(status: string): CSSProperties {
  const base: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid transparent",
    whiteSpace: "nowrap",
  };

  switch (status) {
    case "Drafting":
      return { ...base, color: "#FDE68A", background: "rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.35)" };
    case "Submitted":
      return { ...base, color: "#93C5FD", background: "rgba(59,130,246,0.15)", borderColor: "rgba(59,130,246,0.35)" };
    case "Interview":
      return { ...base, color: "#86EFAC", background: "rgba(34,197,94,0.15)", borderColor: "rgba(34,197,94,0.35)" };
    case "Offer":
      return { ...base, color: "#6EE7B7", background: "rgba(16,185,129,0.15)", borderColor: "rgba(16,185,129,0.35)" };
    case "Unsuccessful":
      return { ...base, color: "#FCA5A5", background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.35)" };
    case "Withdrawn":
      return { ...base, color: "#CBD5E1", background: "rgba(148,163,184,0.14)", borderColor: "rgba(148,163,184,0.30)" };
    default:
      return { ...base, color: "#E5E7EB", background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.15)" };
  }
}

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

  const pageStyle: CSSProperties = {
    minHeight: "100vh",
    background: "#0A0F1E",
    color: "#E5E7EB",
  };

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 18px 60px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 750, letterSpacing: "-0.02em", margin: 0 }}>
              Application Tracker
            </h1>
            <div style={{ marginTop: 6, color: "rgba(229,231,235,0.75)", fontSize: 13 }}>
              Track science teaching applications, deadlines, and statements.
            </div>
          </div>

          <Link
            href="/apply"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(99,102,241,0.18)",
              color: "#E5E7EB",
              border: "1px solid rgba(99,102,241,0.35)",
              textDecoration: "none",
              fontWeight: 650,
            }}
          >
            New Application
          </Link>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setFilterStatus(null)}
            style={{
              padding: "8px 10px",
              borderRadius: 999,
              background: filterStatus === null ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
              color: "#E5E7EB",
              border: "1px solid rgba(255,255,255,0.12)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "8px 10px",
                borderRadius: 999,
                background: filterStatus === s ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                color: "#E5E7EB",
                border: "1px solid rgba(255,255,255,0.12)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <div style={{ padding: 16, color: "rgba(229,231,235,0.8)" }}>Loading…</div>
          ) : error ? (
            <div style={{ padding: 16, color: "#FCA5A5" }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 16, color: "rgba(229,231,235,0.8)" }}>No applications yet</div>
          ) : (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    <th style={thStyle}>School</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Closing date</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, width: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const expanded = expandedId === a.id;
                    return (
                      <Fragment key={a.id}>
                        <tr style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                          <td style={tdStyle}>
                            <div style={{ fontWeight: 700 }}>{a.school_name}</div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ color: "rgba(229,231,235,0.92)" }}>{a.role_title}</div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ color: "rgba(229,231,235,0.85)" }}>
                              {a.closing_date?.trim() ? a.closing_date : "—"}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={badgeStyles(a.status)}>{a.status}</span>
                              <select
                                value={a.status}
                                onChange={(e) => void updateStatus(a.id, e.target.value)}
                                style={{
                                  background: "rgba(10,15,30,0.8)",
                                  color: "#E5E7EB",
                                  border: "1px solid rgba(255,255,255,0.14)",
                                  borderRadius: 10,
                                  padding: "6px 8px",
                                  fontSize: 13,
                                }}
                              >
                                {STATUSES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <button
                              type="button"
                              onClick={() => setExpandedId((cur) => (cur === a.id ? null : a.id))}
                              style={{
                                padding: "8px 10px",
                                borderRadius: 12,
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                color: "#E5E7EB",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 650,
                              }}
                            >
                              {expanded ? "Hide Statement" : "View Statement"}
                            </button>
                          </td>
                        </tr>

                        {expanded ? (
                          <tr>
                            <td
                              colSpan={5}
                              style={{
                                padding: 14,
                                borderTop: "1px solid rgba(255,255,255,0.08)",
                                background: "rgba(255,255,255,0.02)",
                              }}
                            >
                              <div style={{ fontSize: 13, color: "rgba(229,231,235,0.75)", marginBottom: 8 }}>
                                Personal statement
                              </div>
                              <div
                                style={{
                                  whiteSpace: "pre-wrap",
                                  lineHeight: 1.55,
                                  color: "rgba(229,231,235,0.92)",
                                  background: "rgba(10,15,30,0.55)",
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  borderRadius: 14,
                                  padding: 12,
                                }}
                              >
                                {a.personal_statement?.trim()
                                  ? a.personal_statement
                                  : "No statement saved yet."}
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
        </div>
      </div>
    </div>
  );
}

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "rgba(229,231,235,0.7)",
  fontWeight: 700,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "12px 14px",
  verticalAlign: "top",
};

