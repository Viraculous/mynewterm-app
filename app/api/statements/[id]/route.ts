import { deleteStatement, updateStatement } from "@/lib/db";

function jsonError(message: string, status = 500) {
  return Response.json({ ok: false, error: message }, { status });
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return jsonError("Invalid id", 400);

    await deleteStatement(numericId);
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to delete statement";
    return jsonError(msg, 500);
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return jsonError("Invalid id", 400);

    const body = (await request.json().catch(() => null)) as
      | { title?: unknown; tags?: unknown }
      | null;
    if (!body) return jsonError("Invalid JSON body", 400);

    const title = typeof body.title === "string" ? body.title.trim() : undefined;
    const tags =
      body.tags === null ? null : typeof body.tags === "string" ? body.tags : undefined;

    if (title === undefined && tags === undefined) {
      return jsonError("Provide title and/or tags", 400);
    }
    if (title !== undefined && !title) return jsonError("title cannot be empty", 400);

    await updateStatement(numericId, { title, tags });
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof SyntaxError) return jsonError("Invalid JSON body", 400);
    const msg = e instanceof Error ? e.message : "Failed to update statement";
    return jsonError(msg, 500);
  }
}

