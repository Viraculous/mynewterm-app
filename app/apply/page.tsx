"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TermShell,
  TermPanel,
  TermButton,
  TermInput,
  TermTextarea,
  TermModal,
} from "@/components/term";

type GenerateResponse =
  | { ok: true; statement: string }
  | { ok: false; error: string };

type ParseDocumentResponse =
  | { ok: true; text: string }
  | { ok: false; error: string };

function countWords(text: string) {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export default function ApplyPage() {
  const [schoolName, setSchoolName] = useState("");
  const [roleType, setRoleType] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [schoolNotes, setSchoolNotes] = useState("");

  const [isParsingDocument, setIsParsingDocument] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const [statement, setStatement] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveTags, setSaveTags] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const wordCount = useMemo(() => countWords(statement), [statement]);
  const defaultTitle = useMemo(() => {
    const s = schoolName.trim();
    const r = roleType.trim();
    if (s && r) return `${s} — ${r}`;
    if (s) return s;
    if (r) return r;
    return "Saved statement";
  }, [schoolName, roleType]);

  useEffect(() => {
    const qpSchoolName =
      new URLSearchParams(window.location.search).get("schoolName")?.trim() || "";
    if (qpSchoolName && !schoolName.trim()) setSchoolName(qpSchoolName);

    try {
      const storedName = localStorage.getItem("schoolResearch.schoolName") || "";
      const storedNotes = localStorage.getItem("schoolResearch.notes") || "";
      const shouldApplyNotes =
        storedNotes.trim().length > 0 &&
        (!qpSchoolName ||
          storedName.trim().toLowerCase() === qpSchoolName.toLowerCase());

      if (shouldApplyNotes && !schoolNotes.trim()) setSchoolNotes(storedNotes);
    } catch {
      // ignore localStorage errors (e.g. private mode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onUploadJobDescription(file: File) {
    setDocumentError(null);
    setDocumentStatus(null);
    setIsParsingDocument(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-document", {
        method: "POST",
        body: formData,
      });

      const data = (await res.json()) as ParseDocumentResponse;
      if (!res.ok || !data.ok) {
        const msg = !data.ok ? data.error : "Failed to read document.";
        setDocumentError(msg);
        return;
      }

      setJobDescription(data.text);
      setDocumentStatus(
        `Document loaded — ${countWords(data.text)} words extracted`,
      );
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Network error while reading document.";
      setDocumentError(msg);
    } finally {
      setIsParsingDocument(false);
    }
  }

  async function onGenerate() {
    setError(null);
    setCopied(false);
    setSaveSuccess(false);

    if (!schoolName.trim() || !jobDescription.trim()) {
      setError("Please fill in the School Name and Job Description.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: schoolName.trim(),
          roleType: roleType.trim(),
          jobDescription: jobDescription.trim(),
          schoolNotes: schoolNotes.trim(),
        }),
      });

      const data = (await res.json()) as GenerateResponse;
      if (!res.ok || !data.ok) {
        setError(!data.ok ? data.error : "Generation failed.");
        return;
      }

      setStatement(data.statement);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Network error while generating.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(statement);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy to clipboard. Please copy manually.");
    }
  }

  function openSaveModal() {
    setSaveSuccess(false);
    setSaveTitle(defaultTitle);
    setSaveTags("");
    setIsSaveModalOpen(true);
  }

  async function onSaveToLibrary() {
    setError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const res = await fetch("/api/statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: saveTitle.trim() || defaultTitle,
          school_name: schoolName.trim() || null,
          role_type: roleType.trim() || null,
          statement_text: statement,
          word_count: wordCount,
          tags: saveTags.trim() || null,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok: true; id: number }
        | { ok: false; error: string }
        | null;
      if (!res.ok || !data || data.ok !== true) {
        const msg =
          data && "error" in data && typeof data.error === "string"
            ? data.error
            : "Save failed.";
        setError(msg);
        return;
      }

      setIsSaveModalOpen(false);
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 1600);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error while saving.";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <TermShell prompt="./apply">
      <div className="mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-tight text-white md:text-3xl">
          <span className="text-[var(--term-lime)]">{">"}</span> personal statement generator
        </h1>
        <div className="mt-1 text-sm text-[var(--term-text-muted)]">
          // paste vacancy details and generate a tailored UK science teacher statement
        </div>
      </div>

      <TermPanel title="vacancy::input">
        <div className="space-y-5">
          <TermInput
            id="schoolName"
            label={<>School Name <span className="text-red-400">*</span></>}
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
            placeholder="e.g. St Mary's Academy"
          />

          <TermInput
            id="roleType"
            label="Role Type"
            hint="optional"
            value={roleType}
            onChange={(e) => setRoleType(e.target.value)}
            placeholder="e.g. Teacher of Biology (KS3/KS4)"
          />

          <div>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <label
                htmlFor="jdFile"
                className="text-[11px] uppercase tracking-[0.18em] text-[var(--term-text-comment)]"
              >
                // upload job description
              </label>
              <span className="text-[11px] text-[var(--term-text-muted)]">
                optional · pdf · docx · txt
              </span>
            </div>
            <input
              id="jdFile"
              type="file"
              accept=".pdf,.docx,.txt"
              disabled={isParsingDocument}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void onUploadJobDescription(file);
              }}
              className="block w-full cursor-pointer border border-[var(--term-border)] bg-black/40 px-3 py-2 text-sm text-[var(--term-text)] transition-colors file:mr-3 file:border-0 file:border-r file:border-[var(--term-border)] file:bg-cyan-400/10 file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-[0.18em] file:text-cyan-300 hover:border-[var(--term-border-strong)] hover:file:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {isParsingDocument ? (
              <p className="mt-2 text-xs text-[var(--term-text-muted)]">
                // reading document…
              </p>
            ) : null}
            {documentStatus ? (
              <p className="mt-2 text-xs text-[var(--term-lime)]">
                // {documentStatus}
              </p>
            ) : null}
            {documentError ? (
              <p className="mt-2 text-xs text-red-300">// {documentError}</p>
            ) : null}
          </div>

          <TermTextarea
            id="jobDescription"
            label={<>Job Description <span className="text-red-400">*</span></>}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
            rows={10}
            placeholder="Paste the full job description from MyNewTerm here"
          />

          <TermTextarea
            id="schoolNotes"
            label="School Research Notes"
            hint="optional"
            value={schoolNotes}
            onChange={(e) => setSchoolNotes(e.target.value)}
            rows={5}
            placeholder="Ofsted grade, recent results, school ethos, anything relevant"
          />

          {saveSuccess ? (
            <p className="text-xs text-[var(--term-lime)]">// saved to library</p>
          ) : null}
          {error ? (
            <p className="text-xs text-red-300">// error: {error}</p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <TermButton
              variant="primary"
              onClick={onGenerate}
              disabled={isLoading}
            >
              {isLoading ? "[ drafting… ]" : "[+] generate statement"}
            </TermButton>

            {statement ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <TermButton variant="secondary" onClick={onCopy}>
                  {copied ? "[ copied ]" : "[ copy ]"}
                </TermButton>
                <TermButton variant="primary" onClick={openSaveModal}>
                  [ save to library ]
                </TermButton>
              </div>
            ) : null}
          </div>
        </div>
      </TermPanel>

      {statement ? (
        <div className="mt-6">
          <TermPanel title="generated::statement">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--term-text-comment)]">
                // edit freely before copying
              </div>
              <div className="text-xs text-[var(--term-text-muted)]">
                {wordCount} words
              </div>
            </div>

            <textarea
              value={statement}
              onChange={(e) => {
                setStatement(e.target.value);
                setCopied(false);
              }}
              rows={14}
              className="w-full resize-y border border-[var(--term-border)] bg-black/40 px-3 py-3 text-sm leading-relaxed text-white outline-none transition-colors focus:border-[var(--term-border-focus)]"
            />

            <div className="mt-2 text-[11px] text-[var(--term-text-muted)]">
              // tip: aim for 400–500 words
            </div>
          </TermPanel>
        </div>
      ) : null}

      <TermModal
        open={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        title="save statement"
      >
        <div className="space-y-4">
          <TermInput
            id="saveTitle"
            label="Title"
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            placeholder={defaultTitle}
          />
          <TermInput
            id="saveTags"
            label="Tags"
            hint="comma separated"
            value={saveTags}
            onChange={(e) => setSaveTags(e.target.value)}
            placeholder='e.g. "KS4, Biology, Outstanding school"'
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <TermButton
            variant="secondary"
            onClick={() => setIsSaveModalOpen(false)}
            disabled={isSaving}
          >
            [ cancel ]
          </TermButton>
          <TermButton
            variant="primary"
            onClick={() => void onSaveToLibrary()}
            disabled={isSaving}
          >
            {isSaving ? "[ saving… ]" : "[ save ]"}
          </TermButton>
        </div>
      </TermModal>
    </TermShell>
  );
}
