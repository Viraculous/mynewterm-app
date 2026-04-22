"use client";

import { useMemo, useState } from "react";

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
    <div className="flex flex-1 justify-center px-4 py-10 sm:px-6">
      <div className="w-full max-w-3xl">
        <div className="rounded-2xl border border-white/10 bg-[#0A0F1E] p-6 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)] sm:p-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              Science Teacher Profile
            </h1>
            <p className="text-sm text-white/70">
              Build a reusable profile for applications, personal statements, and
              interview preparation.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Alex Patel"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  required
                />
              </Field>

              <Field>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. alex.patel@email.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label htmlFor="careerStage">Career Stage</Label>
                <Select
                  id="careerStage"
                  name="careerStage"
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
                </Select>
              </Field>

              <Field>
                <Label htmlFor="subjectSpecialism">Subject Specialism</Label>
                <Input
                  id="subjectSpecialism"
                  name="subjectSpecialism"
                  type="text"
                  placeholder="e.g. Biology, Chemistry, Physics"
                  value={form.subjectSpecialism}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      subjectSpecialism: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <Label htmlFor="key_stages">Key Stages Taught</Label>
                <Input
                  id="key_stages"
                  name="key_stages"
                  type="text"
                  placeholder="e.g. KS3, KS4, KS5"
                  value={form.key_stages}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, key_stages: e.target.value }))
                  }
                />
              </Field>

              <Field>
                <Label htmlFor="extracurricularContributions">
                  Extracurricular Contributions
                </Label>
                <Input
                  id="extracurricularContributions"
                  name="extracurricularContributions"
                  type="text"
                  placeholder="e.g. STEM club, robotics, revision sessions"
                  value={form.extracurricularContributions}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      extracurricularContributions: e.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            <Field>
              <Label htmlFor="teachingPhilosophy">Teaching Philosophy</Label>
              <TextArea
                id="teachingPhilosophy"
                name="teachingPhilosophy"
                placeholder="Your approach to planning, explanations, modelling, practice, feedback, behaviour routines, and inclusion…"
                value={form.teachingPhilosophy}
                onChange={(e) =>
                  setForm((f) => ({ ...f, teachingPhilosophy: e.target.value }))
                }
                rows={6}
              />
              <Hint>
                Consider: “What do students do in my lessons, and why does it
                work for science?”
              </Hint>
            </Field>

            <Field>
              <Label htmlFor="evidenceBank">Evidence Bank</Label>
              <TextArea
                id="evidenceBank"
                name="evidenceBank"
                placeholder="Add 3–5 impact stories. Include context, action, and outcome (with any numbers you can share)."
                value={form.evidenceBank}
                onChange={(e) =>
                  setForm((f) => ({ ...f, evidenceBank: e.target.value }))
                }
                rows={8}
              />
              <Hint>
                Tip: Use a consistent structure so you can quickly adapt it to
                job criteria.
              </Hint>
            </Field>

            <Field>
              <Label htmlFor="safeguardingApproach">Safeguarding Approach</Label>
              <TextArea
                id="safeguardingApproach"
                name="safeguardingApproach"
                placeholder="How you notice, record, report, and follow up concerns; your stance on professional curiosity and boundaries…"
                value={form.safeguardingApproach}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    safeguardingApproach: e.target.value,
                  }))
                }
                rows={6}
              />
            </Field>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-h-6">
                {successMessage ? (
                  <p className="text-sm font-medium text-green-400">
                    {successMessage}
                  </p>
                ) : null}
                {errorMessage ? (
                  <p className="text-sm font-medium text-red-300">
                    {errorMessage}
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-black transition enabled:hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-white/90">
      {children}
    </label>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-white/60">{children}</p>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-white/40 outline-none",
        "focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none",
        "focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {props.children}
    </select>
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white placeholder:text-white/40 outline-none",
        "focus:border-emerald-400/60 focus:ring-4 focus:ring-emerald-400/10",
        props.className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
