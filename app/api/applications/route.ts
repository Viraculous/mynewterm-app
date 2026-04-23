import { createApplication, getAllApplications, getApplicationById } from "@/lib/db";

export async function GET() {
  const apps = getAllApplications();
  return Response.json(apps);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        school_name?: unknown;
        role_title?: unknown;
        job_description?: unknown;
        school_notes?: unknown;
        personal_statement?: unknown;
        status?: unknown;
        closing_date?: unknown;
        date_added?: unknown;
      }
    | null;

  if (!body || typeof body.school_name !== "string" || typeof body.role_title !== "string") {
    return Response.json(
      { error: "school_name and role_title are required" },
      { status: 400 },
    );
  }

  const id = createApplication({
    school_name: body.school_name,
    role_title: body.role_title,
    job_description: typeof body.job_description === "string" ? body.job_description : null,
    school_notes: typeof body.school_notes === "string" ? body.school_notes : null,
    personal_statement:
      typeof body.personal_statement === "string" ? body.personal_statement : null,
    status: typeof body.status === "string" ? body.status : null,
    closing_date: typeof body.closing_date === "string" ? body.closing_date : null,
    date_added: typeof body.date_added === "string" ? body.date_added : null,
  });

  const created = getApplicationById(id);
  return Response.json(created ?? { id }, { status: 201 });
}

