import {
  deleteApplication,
  getApplicationById,
  updateApplicationStatement,
  updateApplicationStatus,
} from "@/lib/db";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | { status?: unknown; statement?: unknown }
    | null;
  if (!body) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await getApplicationById(numericId);
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const nextStatus = typeof body.status === "string" ? body.status : null;
  const nextStatement = typeof body.statement === "string" ? body.statement : null;

  if (!nextStatus && !nextStatement) {
    return Response.json(
      { error: "Provide status and/or statement" },
      { status: 400 },
    );
  }

  if (nextStatus) await updateApplicationStatus(numericId, nextStatus);
  if (nextStatement) await updateApplicationStatement(numericId, nextStatement);

  const updated = await getApplicationById(numericId);
  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }

  const existing = await getApplicationById(numericId);
  if (!existing) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await deleteApplication(numericId);
  return Response.json({ ok: true });
}

