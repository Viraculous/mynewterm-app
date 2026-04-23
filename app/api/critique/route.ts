import { NextResponse } from "next/server";

import OpenAI from "openai";

function jsonError(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

type CritiquePayload = {
  statement: string;
  jobDescription?: string;
};

function isCritiquePayload(value: unknown): value is CritiquePayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.statement === "string" &&
    v.statement.trim().length > 0 &&
    (v.jobDescription === undefined || typeof v.jobDescription === "string")
  );
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return jsonError("Missing DEEPSEEK_API_KEY environment variable", 500);

    const body = (await req.json()) as unknown;
    if (!isCritiquePayload(body)) {
      return jsonError("Invalid request body. Expected statement (string) and optional jobDescription.", 400);
    }

    const { statement, jobDescription } = body;

    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });

    const system = [
      `You are an experienced UK secondary school headteacher and safer recruitment panel member.`,
      `You are reviewing a science teacher personal statement for a UK teaching application.`,
      `Write in professional, supportive British English.`,
      `Be specific and evidence-focused. Do not invent facts; critique what is written.`,
      `Safeguarding is non-negotiable: flag missing safeguarding awareness clearly.`,
      `Return valid JSON only (no markdown, no code fences, no commentary).`,
    ].join(" ");

    const userPrompt = [
      `Evaluate the personal statement against the UK Teachers' Standards and safeguarding awareness.`,
      ``,
      `Teachers' Standards to evaluate:`,
      `- TS1: Set high expectations`,
      `- TS2: Promote good progress`,
      `- TS3: Demonstrate good subject and curriculum knowledge`,
      `- TS4: Plan and teach well structured lessons`,
      `- TS5: Adapt teaching to respond to pupils needs`,
      `- TS6: Make accurate and productive use of assessment`,
      `- TS7: Manage behaviour effectively`,
      `- TS8: Fulfil wider professional responsibilities`,
      `- Plus safeguarding awareness`,
      ``,
      `If a job description is provided, use it only as context for relevance and tailoring.`,
      ``,
      `Output JSON schema (must match exactly):`,
      `{`,
      `  "overallScore": number, // 0-10 integer or one decimal`,
      `  "overallSummary": string, // 2-3 sentences`,
      `  "standards": {`,
      `    "TS1": { "rating": "Strong" | "Good" | "Weak" | "Missing", "feedback": string },`,
      `    "TS2": { "rating": "Strong" | "Good" | "Weak" | "Missing", "feedback": string },`,
      `    "TS3": { "rating": "Strong" | "Good" | "Weak" | "Missing", "feedback": string },`,
      `    "TS4": { "rating": "Strong" | "Good" | "Weak" | "Missing", "feedback": string },`,
      `    "TS5": { "rating": "Strong" | "Good" | "Weak" | "Missing", "feedback": string },`,
      `    "TS6": { "rating": "Strong" | "Good" | "Weak" | "Missing", "feedback": string },`,
      `    "TS7": { "rating": "Strong" | "Good" | "Weak" | "Missing", "feedback": string },`,
      `    "TS8": { "rating": "Strong" | "Good" | "Weak" | "Missing", "feedback": string },`,
      `    "Safeguarding": { "rating": "Strong" | "Good" | "Weak" | "Missing", "feedback": string }`,
      `  },`,
      `  "strengths": [string, string, string],`,
      `  "improvements": [`,
      `    { "suggestion": string, "exampleRewrite": string },`,
      `    { "suggestion": string, "exampleRewrite": string },`,
      `    { "suggestion": string, "exampleRewrite": string }`,
      `  ],`,
      `  "revisedOpeningParagraph": string`,
      `}`,
      ``,
      `Job description (optional):`,
      jobDescription?.trim().length ? jobDescription.trim() : "(not provided)",
      ``,
      `Personal statement to critique:`,
      statement.trim(),
    ].join("\n");

    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    const critique = completion.choices?.[0]?.message?.content?.trim();
    if (!critique) return jsonError("Critique failed: empty response from model", 502);

    return NextResponse.json({ ok: true, critique }, { status: 200 });
  } catch (err) {
    if (err instanceof SyntaxError) return jsonError("Invalid JSON body", 400);
    const message = err instanceof Error ? err.message : "Failed to critique statement";
    return jsonError(message, 500);
  }
}

