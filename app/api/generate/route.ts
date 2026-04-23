import { NextResponse } from "next/server";

import OpenAI from "openai";

import { db, getProfile } from "@/lib/db";

function jsonError(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

type GeneratePayload = {
  schoolName: string;
  jobDescription: string;
  schoolNotes?: string;
};

function isGeneratePayload(value: unknown): value is GeneratePayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.schoolName === "string" &&
    v.schoolName.trim().length > 0 &&
    typeof v.jobDescription === "string" &&
    v.jobDescription.trim().length > 0 &&
    (v.schoolNotes === undefined || typeof v.schoolNotes === "string")
  );
}

function formatProfileForPrompt(profile: ReturnType<typeof getProfile>) {
  return [
    `Name: ${profile.name || "(not provided)"}`,
    `Email: ${profile.email || "(not provided)"}`,
    `Career stage: ${profile.career_stage || "(not provided)"}`,
    `Subject specialism: ${profile.subject_specialism || "(not provided)"}`,
    `Key stages: ${profile.key_stages?.length ? profile.key_stages.join(", ") : "(not provided)"}`,
    ``,
    `Teaching philosophy:`,
    profile.teaching_philosophy || "(not provided)",
    ``,
    `Evidence / impact bank (use concrete specifics from here):`,
    profile.evidence_bank || "(not provided)",
    ``,
    `Safeguarding:`,
    profile.safeguarding || "(not provided)",
    ``,
    `Extracurricular / wider contribution:`,
    profile.extracurricular || "(not provided)",
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return jsonError("Missing DEEPSEEK_API_KEY environment variable", 500);

    const body = (await req.json()) as unknown;
    if (!isGeneratePayload(body)) {
      return jsonError("Invalid request body. Expected schoolName and jobDescription.", 400);
    }

    const { schoolName, jobDescription, schoolNotes } = body;

    // Ensure DB is initialized and schema exists
    db();
    const profile = getProfile();

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });

    const system = [
      `You are an expert UK teacher application writer.`,
      `Write in natural British English.`,
      `Follow the user's constraints exactly.`,
    ].join(" ");

    const userPrompt = [
      `Task: Write a tailored UK science teacher personal statement (400–500 words).`,
      ``,
      `Must-haves:`,
      `- Address the specific school and role (use the school name).`,
      `- Reference the Teachers’ Standards implicitly (do not list or quote them).`,
      `- Include evidence of impact with concrete specifics drawn from the candidate profile.`,
      `- Mention safeguarding awareness appropriately.`,
      `- Cover practical science teaching and strong subject knowledge.`,
      `- Sound authentic and personal (avoid generic phrases and clichés).`,
      `- Use flowing paragraphs, no bullet points, no headings.`,
      ``,
      `School name: ${schoolName}`,
      ``,
      `Job description:`,
      jobDescription,
      ``,
      `School research notes (optional; use if relevant):`,
      (schoolNotes?.trim().length ? schoolNotes : "(none provided)"),
      ``,
      `Candidate profile:`,
      formatProfileForPrompt(profile),
      ``,
      `Now write the personal statement only (no preamble, no signatures).`,
    ].join("\n");

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const statement = completion.choices?.[0]?.message?.content?.trim();
    if (!statement) return jsonError("Generation failed: empty response from model", 502);

    return NextResponse.json({ ok: true, statement }, { status: 200 });
  } catch (err) {
    if (err instanceof SyntaxError) return jsonError("Invalid JSON body", 400);
    const message = err instanceof Error ? err.message : "Failed to generate statement";
    return jsonError(message, 500);
  }
}

