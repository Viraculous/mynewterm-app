import { getAllStatements, saveStatement } from "@/lib/db";

function jsonError(message: string, status = 500) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function GET() {
  try {
    const statements = getAllStatements();
    return Response.json({ ok: true, statements });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load statements";
    return jsonError(msg, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          title?: unknown;
          school_name?: unknown;
          role_type?: unknown;
          statement_text?: unknown;
          word_count?: unknown;
          date_saved?: unknown;
          tags?: unknown;
        }
      | null;

    if (!body) return jsonError("Invalid JSON body", 400);
    if (typeof body.title !== "string" || !body.title.trim()) {
      return jsonError("title is required", 400);
    }
    if (typeof body.statement_text !== "string" || !body.statement_text.trim()) {
      return jsonError("statement_text is required", 400);
    }

    const id = saveStatement({
      title: body.title.trim(),
      school_name: typeof body.school_name === "string" ? body.school_name.trim() : null,
      role_type: typeof body.role_type === "string" ? body.role_type.trim() : null,
      statement_text: body.statement_text,
      word_count:
        typeof body.word_count === "number" && Number.isFinite(body.word_count)
          ? Math.trunc(body.word_count)
          : null,
      date_saved: typeof body.date_saved === "string" ? body.date_saved : null,
      tags: typeof body.tags === "string" ? body.tags : null,
    });

    return Response.json({ ok: true, id }, { status: 201 });
  } catch (e) {
    if (e instanceof SyntaxError) return jsonError("Invalid JSON body", 400);
    const msg = e instanceof Error ? e.message : "Failed to save statement";
    return jsonError(msg, 500);
  }
}

