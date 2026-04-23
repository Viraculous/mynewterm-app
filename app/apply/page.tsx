"use client";

import { useMemo, useState } from "react";

type GenerateResponse =
  | { ok: true; statement: string }
  | { ok: false; error: string };

type ParseDocumentResponse = { ok: true; text: string } | { ok: false; error: string };

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
      setDocumentStatus(`Document loaded — ${countWords(data.text)} words extracted`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error while reading document.";
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
      const msg = e instanceof Error ? e.message : "Network error while generating.";
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
        const msg = data && "error" in data && typeof data.error === "string" ? data.error : "Save failed.";
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
    <div className="min-h-screen bg-[#0A0F1E] text-slate-100">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Personal Statement Generator</h1>
          <p className="mt-2 text-sm text-slate-300">
            Paste the vacancy details and generate a tailored UK science teacher personal statement.
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              School Name <span className="text-rose-400">*</span>
            </label>
            <input
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none ring-0 transition focus:border-slate-600"
              placeholder="e.g. St Mary’s Academy"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Role Type <span className="text-slate-500">(optional)</span>
            </label>
            <input
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none ring-0 transition focus:border-slate-600"
              placeholder="e.g. Teacher of Biology (KS3/KS4)"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Upload Job Description <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              disabled={isParsingDocument}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void onUploadJobDescription(file);
              }}
              className="block w-full cursor-pointer rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-200 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:file:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            />

            {isParsingDocument ? (
              <p className="mt-2 text-sm text-slate-300">Reading document...</p>
            ) : null}
            {documentStatus ? <p className="mt-2 text-sm text-emerald-400">{documentStatus}</p> : null}
            {documentError ? <p className="mt-2 text-sm text-rose-400">{documentError}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Job Description <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              required
              rows={10}
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-slate-600"
              placeholder="Paste the full job description from MyNewTerm here"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              School Research Notes <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              value={schoolNotes}
              onChange={(e) => setSchoolNotes(e.target.value)}
              rows={5}
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-slate-600"
              placeholder="Ofsted grade, recent results, school ethos, anything relevant"
            />
          </div>

          {saveSuccess ? <p className="text-sm text-emerald-400">Saved to library</p> : null}
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onGenerate}
              disabled={isLoading}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Drafting your statement..." : "Generate Personal Statement"}
            </button>

            {statement ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={onCopy}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/40 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
                >
                  {copied ? "Copied" : "Copy to Clipboard"}
                </button>
                <button
                  type="button"
                  onClick={openSaveModal}
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-700/60 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-200 transition hover:border-emerald-500/80 hover:bg-emerald-500/15"
                >
                  Save to Library
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {statement ? (
          <div className="mt-8 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-base font-semibold text-slate-200">Generated statement</h2>
              <div className="text-sm text-slate-400">{wordCount} words</div>
            </div>

            <textarea
              value={statement}
              onChange={(e) => {
                setStatement(e.target.value);
                setCopied(false);
              }}
              rows={14}
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-100 outline-none transition focus:border-slate-600"
            />

            <div className="text-xs text-slate-500">
              Tip: Aim for 400–500 words. You can edit the draft freely before copying.
            </div>
          </div>
        ) : null}
      </div>

      {isSaveModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0B1222] p-5 shadow-xl">
            <div className="mb-4">
              <div className="text-base font-semibold text-slate-100">Save statement to library</div>
              <div className="mt-1 text-sm text-slate-400">Give it a title and optional tags.</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">Title</label>
                <input
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-slate-600"
                  placeholder={defaultTitle}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Tags <span className="text-slate-500">(comma separated)</span>
                </label>
                <input
                  value={saveTags}
                  onChange={(e) => setSaveTags(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-slate-600"
                  placeholder='e.g. "KS4, Biology, Outstanding school"'
                />
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900/40 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onSaveToLibrary()}
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

