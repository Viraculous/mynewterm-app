import { NextResponse } from "next/server";

import OpenAI from "openai";

function jsonError(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

type SchoolResearchPayload = {
  schoolName: string;
};

function isSchoolResearchPayload(value: unknown): value is SchoolResearchPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.schoolName === "string" && v.schoolName.trim().length > 0;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return jsonError("Missing DEEPSEEK_API_KEY environment variable", 500);

    const body = (await req.json()) as unknown;
    if (!isSchoolResearchPayload(body)) {
      return jsonError("Invalid request body. Expected { schoolName: string }.", 400);
    }

    const schoolName = body.schoolName.trim();

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });

    const system = [
      "You are a UK education research assistant helping a science teacher prepare a job application.",
      "Write in clear British English.",
      "If you do not have reliable information about a specific school, say so explicitly.",
      "Do not invent Ofsted ratings, enrolment numbers, results, locations, or news.",
      'Return valid JSON only (no markdown, no code fences, no commentary).',
    ].join(" ");

    const userPrompt = [
      `Research the following school: ${schoolName}`,
      ``,
      `Provide a structured summary with these sections:`,
      `- School type (academy, comprehensive, grammar, faith etc)`,
      `- Ofsted rating and key findings if known`,
      `- Approximate size and age range`,
      `- Notable strengths or specialisms`,
      `- Science department reputation if known`,
      `- Typical intake and community context`,
      `- Any known recent news or developments`,
      `- Suggested talking points for a personal statement targeting this school`,
      ``,
      `Important: If you are unsure about any item, say "Unknown" and explain what would need verifying.`,
      ``,
      `Output JSON schema (must match exactly):`,
      `{`,
      `  "schoolName": string,`,
      `  "overview": {`,
      `    "schoolType": string,`,
      `    "ageRange": string,`,
      `    "approxSize": string,`,
      `    "specialisms": string[],`,
      `    "notableStrengths": string[]`,
      `  },`,
      `  "ofsted": {`,
      `    "rating": "Outstanding" | "Good" | "Requires Improvement" | "Inadequate" | "Not yet inspected" | "Unknown",`,
      `    "keyFindings": string[]`,
      `  },`,
      `  "scienceDepartment": {`,
      `    "reputation": string,`,
      `    "notes": string[]`,
      `  },`,
      `  "communityContext": {`,
      `    "intake": string,`,
      `    "contextNotes": string[]`,
      `  },`,
      `  "recentNews": string[],`,
      `  "talkingPoints": string[],`,
      `  "verificationNotes": string[]`,
      `}`,
      ``,
      `Now return JSON only.`,
    ].join("\n");

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    const research = completion.choices?.[0]?.message?.content?.trim();
    if (!research) return jsonError("Research failed: empty response from model", 502);

    return NextResponse.json({ ok: true, research }, { status: 200 });
  } catch (err) {
    if (err instanceof SyntaxError) return jsonError("Invalid JSON body", 400);
    const message = err instanceof Error ? err.message : "Failed to research school";
    return jsonError(message, 500);
  }
}

