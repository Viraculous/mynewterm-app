"use client";

import { useMemo, useState } from "react";
import {
  TermShell,
  TermPanel,
  TermInput,
  TermSelect,
  TermTextarea,
  TermButton,
} from "@/components/term";

type CareerStage =
  | "ECT"
  | "Experienced Teacher 1-5 years"
  | "Experienced Teacher 5+ years"
  | "Aspiring Middle Leader"
  | "Middle Leader";

type ProfilePayload = {
  fullName: string;
  email: string;
  careerStage: CareerStage | "";
  subjectSpecialism: string;
  key_stages: string;
  teachingPhilosophy: string;
  evidenceBank: string;
  safeguardingApproach: string;
  extracurricularContributions: string;
};

const careerStageOptions: CareerStage[] = [
  "ECT",
  "Experienced Teacher 1-5 years",
  "Experienced Teacher 5+ years",
  "Aspiring Middle Leader",
  "Middle Leader",
];

export default function ProfilePage() {
  const [form, setForm] = useState<ProfilePayload>({
    fullName: "",
    email: "",
    careerStage: "",
    subjectSpecialism: "",
    key_stages: "",
    teachingPhilosophy: "",
    evidenceBank: "",
    safeguardingApproach: "",
    extracurricularContributions: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      form.fullName.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.careerStage !== "" &&
      !isSaving
    );
  }, [form, isSaving]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        name: form.fullName,
        email: form.email,
        career_stage: form.careerStage,
        subject_specialism: form.subjectSpecialism,
        key_stages: form.key_stages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        teaching_philosophy: form.teachingPhilosophy,
        evidence_bank: form.evidenceBank,
        safeguarding: form.safeguardingApproach,
        extracurricular: form.extracurricularContributions,
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const maybeJson = await res
        .json()
        .catch(() => ({ message: "Failed to save profile." }) as const);

      if (!res.ok || maybeJson?.ok !== true) {
        const message =
          typeof maybeJson?.message === "string"
            ? maybeJson.message
            : "Failed to save profile.";
        throw new Error(message);
      }

      setSuccessMessage("Saved successfully.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save profile.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <TermShell prompt="./profile">
      <div className="mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
          <span className="text-[var(--term-lime)]">{">"}</span> profile
        </h1>
        <div className="mt-1 text-sm text-[var(--term-text-muted)]">
          // reusable details for applications, statements, and interviews
        </div>
      </div>

      <TermPanel title="science teacher::profile">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TermInput
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              label={<>Full Name <span className="text-red-400">*</span></>}
              placeholder="e.g. Alex Patel"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
            />
            <TermInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              label={<>Email <span className="text-red-400">*</span></>}
              placeholder="e.g. alex.patel@email.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TermSelect
              id="careerStage"
              name="careerStage"
              label={<>Career Stage <span className="text-red-400">*</span></>}
              value={form.careerStage}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  careerStage: e.target.value as CareerStage | "",
                }))
              }
              required
            >
              <option value="" disabled>
                Select a career stage
              </option>
              {careerStageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </TermSelect>

            <TermInput
              id="subjectSpecialism"
              name="subjectSpecialism"
              type="text"
              label="Subject Specialism"
              placeholder="e.g. Biology, Chemistry, Physics"
              value={form.subjectSpecialism}
              onChange={(e) =>
                setForm((f) => ({ ...f, subjectSpecialism: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TermInput
              id="key_stages"
              name="key_stages"
              type="text"
              label="Key Stages Taught"
              placeholder="e.g. KS3, KS4, KS5"
              value={form.key_stages}
              onChange={(e) =>
                setForm((f) => ({ ...f, key_stages: e.target.value }))
              }
            />
            <TermInput
              id="extracurricularContributions"
              name="extracurricularContributions"
              type="text"
              label="Extracurricular Contributions"
              placeholder="e.g. STEM club, robotics, revision sessions"
              value={form.extracurricularContributions}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  extracurricularContributions: e.target.value,
                }))
              }
            />
          </div>

          <TermTextarea
            id="teachingPhilosophy"
            name="teachingPhilosophy"
            label="Teaching Philosophy"
            hint="what do students do in your lessons, and why?"
            rows={6}
            value={form.teachingPhilosophy}
            onChange={(e) =>
              setForm((f) => ({ ...f, teachingPhilosophy: e.target.value }))
            }
            placeholder="Your approach to planning, explanations, modelling, practice, feedback, behaviour routines, and inclusion…"
          />

          <TermTextarea
            id="evidenceBank"
            name="evidenceBank"
            label="Evidence Bank"
            hint="3–5 impact stories with context · action · outcome"
            rows={8}
            value={form.evidenceBank}
            onChange={(e) =>
              setForm((f) => ({ ...f, evidenceBank: e.target.value }))
            }
            placeholder="Add 3–5 impact stories. Include context, action, and outcome (with any numbers you can share)."
          />

          <TermTextarea
            id="safeguardingApproach"
            name="safeguardingApproach"
            label="Safeguarding Approach"
            rows={6}
            value={form.safeguardingApproach}
            onChange={(e) =>
              setForm((f) => ({ ...f, safeguardingApproach: e.target.value }))
            }
            placeholder="How you notice, record, report, and follow up concerns; your stance on professional curiosity and boundaries…"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-6 text-xs">
              {successMessage ? (
                <p className="text-[var(--term-lime)]">// {successMessage}</p>
              ) : null}
              {errorMessage ? (
                <p className="text-red-300">// error: {errorMessage}</p>
              ) : null}
            </div>

            <TermButton type="submit" variant="primary" disabled={!canSubmit}>
              {isSaving ? "[ saving… ]" : "[ save ]"}
            </TermButton>
          </div>
        </form>
      </TermPanel>
    </TermShell>
  );
}
