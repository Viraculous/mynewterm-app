import { NextResponse } from "next/server";

import { createTables, getProfile, upsertProfile, type Profile } from "@/lib/db";

function jsonError(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function isProfilePayload(value: unknown): value is Profile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.name === "string" &&
    typeof v.email === "string" &&
    typeof v.career_stage === "string" &&
    typeof v.subject_specialism === "string" &&
    Array.isArray(v.key_stages) &&
    v.key_stages.every((x) => typeof x === "string") &&
    typeof v.teaching_philosophy === "string" &&
    typeof v.evidence_bank === "string" &&
    typeof v.safeguarding === "string" &&
    typeof v.extracurricular === "string"
  );
}

export async function GET() {
  try {
    await createTables();
    const profile = await getProfile();
    return NextResponse.json({ ok: true, profile }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch profile";
    return jsonError(message, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as unknown;
    if (!isProfilePayload(body)) return jsonError("Invalid profile payload", 400);

    await createTables();
    await upsertProfile(body);
    const profile = await getProfile();

    return NextResponse.json({ ok: true, profile }, { status: 200 });
  } catch (err) {
    if (err instanceof SyntaxError) return jsonError("Invalid JSON body", 400);
    const message = err instanceof Error ? err.message : "Failed to save profile";
    return jsonError(message, 500);
  }
}

