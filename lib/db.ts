import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export type ProfileRow = {
  name: string | null;
  email: string | null;
  career_stage: string | null;
  subject_specialism: string | null;
  key_stages: string | null; // JSON-encoded string[]
  teaching_philosophy: string | null;
  evidence_bank: string | null;
  safeguarding: string | null;
  extracurricular: string | null;
  updated_at: string;
};

export type Profile = {
  name: string;
  email: string;
  career_stage: string;
  subject_specialism: string;
  key_stages: string[];
  teaching_philosophy: string;
  evidence_bank: string;
  safeguarding: string;
  extracurricular: string;
  updated_at?: string;
};

export type ApplicationRow = {
  id: number;
  school_name: string;
  role_title: string;
  job_description: string | null;
  school_notes: string | null;
  personal_statement: string | null;
  status: string;
  closing_date: string | null;
  date_added: string | null;
  updated_at: string | null;
};

export type CreateApplicationInput = {
  school_name: string;
  role_title: string;
  job_description?: string | null;
  school_notes?: string | null;
  personal_statement?: string | null;
  status?: string | null;
  closing_date?: string | null;
  date_added?: string | null;
};

export type StatementRow = {
  id: number;
  title: string;
  school_name: string | null;
  role_type: string | null;
  statement_text: string;
  word_count: number | null;
  date_saved: string | null;
  tags: string | null;
};

export type SaveStatementInput = {
  title: string;
  school_name?: string | null;
  role_type?: string | null;
  statement_text: string;
  word_count?: number | null;
  date_saved?: string | null;
  tags?: string | null;
};

export type UpdateStatementInput = {
  title?: string;
  tags?: string | null;
};

export async function createTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS profile (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default' UNIQUE,
      name TEXT,
      email TEXT,
      career_stage TEXT,
      subject_specialism TEXT,
      key_stages TEXT,
      teaching_philosophy TEXT,
      evidence_bank TEXT,
      safeguarding TEXT,
      extracurricular TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      school_name TEXT NOT NULL,
      role_title TEXT NOT NULL,
      job_description TEXT,
      school_notes TEXT,
      personal_statement TEXT,
      status TEXT DEFAULT 'Drafting',
      closing_date TEXT,
      date_added TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS statements (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default',
      title TEXT NOT NULL,
      school_name TEXT,
      role_type TEXT,
      statement_text TEXT NOT NULL,
      word_count INTEGER,
      date_saved TIMESTAMP DEFAULT NOW(),
      tags TEXT
    )
  `;
}

export async function getProfile(): Promise<Profile & { updated_at: string }> {
  const rows = (await sql`
    SELECT
      name,
      email,
      career_stage,
      subject_specialism,
      key_stages,
      teaching_philosophy,
      evidence_bank,
      safeguarding,
      extracurricular,
      updated_at
    FROM profile
    WHERE user_id = 'default'
    LIMIT 1
  `) as (ProfileRow & { updated_at: string | Date })[];

  const row = rows[0];

  let keyStages: string[] = [];
  if (row?.key_stages) {
    try {
      const parsed = JSON.parse(row.key_stages) as unknown;
      if (Array.isArray(parsed)) keyStages = parsed.filter((x) => typeof x === "string");
    } catch {
      // ignore parse errors; treat as empty
    }
  }

  const updatedAt = row?.updated_at
    ? typeof row.updated_at === "string"
      ? row.updated_at
      : String(row.updated_at)
    : new Date().toISOString();

  return {
    name: row?.name ?? "",
    email: row?.email ?? "",
    career_stage: row?.career_stage ?? "",
    subject_specialism: row?.subject_specialism ?? "",
    key_stages: keyStages,
    teaching_philosophy: row?.teaching_philosophy ?? "",
    evidence_bank: row?.evidence_bank ?? "",
    safeguarding: row?.safeguarding ?? "",
    extracurricular: row?.extracurricular ?? "",
    updated_at: updatedAt,
  };
}

export async function upsertProfile(input: Profile) {
  const keyStagesJson = JSON.stringify(
    (input.key_stages ?? []).filter((x) => typeof x === "string" && x.trim().length > 0),
  );

  await sql`
    INSERT INTO profile (
      user_id,
      name,
      email,
      career_stage,
      subject_specialism,
      key_stages,
      teaching_philosophy,
      evidence_bank,
      safeguarding,
      extracurricular,
      updated_at
    ) VALUES (
      'default',
      ${input.name ?? ""},
      ${input.email ?? ""},
      ${input.career_stage ?? ""},
      ${input.subject_specialism ?? ""},
      ${keyStagesJson},
      ${input.teaching_philosophy ?? ""},
      ${input.evidence_bank ?? ""},
      ${input.safeguarding ?? ""},
      ${input.extracurricular ?? ""},
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      career_stage = EXCLUDED.career_stage,
      subject_specialism = EXCLUDED.subject_specialism,
      key_stages = EXCLUDED.key_stages,
      teaching_philosophy = EXCLUDED.teaching_philosophy,
      evidence_bank = EXCLUDED.evidence_bank,
      safeguarding = EXCLUDED.safeguarding,
      extracurricular = EXCLUDED.extracurricular,
      updated_at = NOW()
  `;
}

export async function getAllApplications(): Promise<ApplicationRow[]> {
  const rows = (await sql`
    SELECT
      id,
      school_name,
      role_title,
      job_description,
      school_notes,
      personal_statement,
      status,
      closing_date,
      date_added,
      updated_at
    FROM applications
    ORDER BY date_added DESC
  `) as ApplicationRow[];

  return rows;
}

export async function getApplicationById(id: number): Promise<ApplicationRow | undefined> {
  const rows = (await sql`
    SELECT
      id,
      school_name,
      role_title,
      job_description,
      school_notes,
      personal_statement,
      status,
      closing_date,
      date_added,
      updated_at
    FROM applications
    WHERE id = ${id}
    LIMIT 1
  `) as ApplicationRow[];

  return rows[0];
}

export async function createApplication(data: CreateApplicationInput): Promise<number> {
  const rows = (await sql`
    INSERT INTO applications (
      user_id,
      school_name,
      role_title,
      job_description,
      school_notes,
      personal_statement,
      status,
      closing_date,
      date_added,
      updated_at
    ) VALUES (
      'default',
      ${data.school_name},
      ${data.role_title},
      ${data.job_description ?? null},
      ${data.school_notes ?? null},
      ${data.personal_statement ?? null},
      ${data.status ?? "Drafting"},
      ${data.closing_date ?? null},
      COALESCE(${data.date_added ?? null}::timestamp, NOW()),
      NOW()
    )
    RETURNING id
  `) as { id: number }[];

  return rows[0]?.id ?? 0;
}

export async function updateApplicationStatus(id: number, status: string) {
  await sql`
    UPDATE applications
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function updateApplicationStatement(id: number, statement: string) {
  await sql`
    UPDATE applications
    SET personal_statement = ${statement}, updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function deleteApplication(id: number) {
  await sql`DELETE FROM applications WHERE id = ${id}`;
}

export async function getAllStatements(): Promise<StatementRow[]> {
  const rows = (await sql`
    SELECT
      id,
      title,
      school_name,
      role_type,
      statement_text,
      word_count,
      date_saved,
      tags
    FROM statements
    ORDER BY date_saved DESC
  `) as StatementRow[];

  return rows;
}

export async function saveStatement(data: SaveStatementInput): Promise<number> {
  const rows = (await sql`
    INSERT INTO statements (
      user_id,
      title,
      school_name,
      role_type,
      statement_text,
      word_count,
      date_saved,
      tags
    ) VALUES (
      'default',
      ${data.title},
      ${data.school_name ?? null},
      ${data.role_type ?? null},
      ${data.statement_text},
      ${data.word_count ?? null},
      COALESCE(${data.date_saved ?? null}::timestamp, NOW()),
      ${data.tags ?? null}
    )
    RETURNING id
  `) as { id: number }[];

  return rows[0]?.id ?? 0;
}

export async function deleteStatement(id: number) {
  await sql`DELETE FROM statements WHERE id = ${id}`;
}

export async function updateStatement(id: number, data: UpdateStatementInput) {
  const title = typeof data.title === "string" ? data.title : undefined;
  const tags = data.tags === null || typeof data.tags === "string" ? data.tags : undefined;

  if (title === undefined && tags === undefined) return;

  if (title !== undefined && tags !== undefined) {
    await sql`UPDATE statements SET title = ${title}, tags = ${tags} WHERE id = ${id}`;
    return;
  }

  if (title !== undefined) {
    await sql`UPDATE statements SET title = ${title} WHERE id = ${id}`;
  }
  if (tags !== undefined) {
    await sql`UPDATE statements SET tags = ${tags} WHERE id = ${id}`;
  }
}

