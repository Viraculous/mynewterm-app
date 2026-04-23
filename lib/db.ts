import Database from "better-sqlite3";
import path from "node:path";

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

let _db: Database.Database | null = null;

function getDbPath() {
  // Keep DB in-repo for local dev; change to a durable volume in production.
  return path.join(process.cwd(), "data", "app.db");
}

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

export function db() {
  if (_db) return _db;

  const dbPath = getDbPath();
  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT,
      email TEXT,
      career_stage TEXT,
      subject_specialism TEXT,
      key_stages TEXT,
      teaching_philosophy TEXT,
      evidence_bank TEXT,
      safeguarding TEXT,
      extracurricular TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  _db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_name TEXT NOT NULL,
      role_title TEXT NOT NULL,
      job_description TEXT,
      school_notes TEXT,
      personal_statement TEXT,
      status TEXT DEFAULT 'Drafting',
      closing_date TEXT,
      date_added TEXT,
      updated_at TEXT
    );
  `);

  // Ensure a single row exists.
  _db
    .prepare(
      `INSERT OR IGNORE INTO profile (id, updated_at) VALUES (1, datetime('now'))`,
    )
    .run();

  return _db;
}

export function getAllApplications(): ApplicationRow[] {
  return db()
    .prepare(
      `SELECT id, school_name, role_title, job_description, school_notes, personal_statement, status, closing_date, date_added, updated_at
       FROM applications
       ORDER BY date_added DESC`,
    )
    .all() as ApplicationRow[];
}

export function getApplicationById(id: number): ApplicationRow | undefined {
  return db()
    .prepare(
      `SELECT id, school_name, role_title, job_description, school_notes, personal_statement, status, closing_date, date_added, updated_at
       FROM applications
       WHERE id = ?`,
    )
    .get(id) as ApplicationRow | undefined;
}

export function createApplication(data: CreateApplicationInput): number {
  const nowIso = new Date().toISOString();
  const result = db()
    .prepare(
      `INSERT INTO applications (
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
        @school_name,
        @role_title,
        @job_description,
        @school_notes,
        @personal_statement,
        COALESCE(@status, 'Drafting'),
        @closing_date,
        COALESCE(@date_added, @now),
        @now
      )`,
    )
    .run({
      school_name: data.school_name,
      role_title: data.role_title,
      job_description: data.job_description ?? null,
      school_notes: data.school_notes ?? null,
      personal_statement: data.personal_statement ?? null,
      status: data.status ?? null,
      closing_date: data.closing_date ?? null,
      date_added: data.date_added ?? null,
      now: nowIso,
    });

  return Number(result.lastInsertRowid);
}

export function updateApplicationStatus(id: number, status: string) {
  db()
    .prepare(
      `UPDATE applications
       SET status = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(status, new Date().toISOString(), id);
}

export function updateApplicationStatement(id: number, statement: string) {
  db()
    .prepare(
      `UPDATE applications
       SET personal_statement = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(statement, new Date().toISOString(), id);
}

export function deleteApplication(id: number) {
  db().prepare(`DELETE FROM applications WHERE id = ?`).run(id);
}

export function getProfileRow(): ProfileRow {
  const row = db()
    .prepare(
      `SELECT name, email, career_stage, subject_specialism, key_stages, teaching_philosophy, evidence_bank, safeguarding, extracurricular, updated_at
       FROM profile
       WHERE id = 1`,
    )
    .get() as ProfileRow | undefined;

  if (!row) {
    // Should not happen due to INSERT OR IGNORE above, but keep safe.
    return {
      name: null,
      email: null,
      career_stage: null,
      subject_specialism: null,
      key_stages: null,
      teaching_philosophy: null,
      evidence_bank: null,
      safeguarding: null,
      extracurricular: null,
      updated_at: new Date().toISOString(),
    };
  }

  return row;
}

export function getProfile(): Profile & { updated_at: string } {
  const row = getProfileRow();

  let keyStages: string[] = [];
  if (row.key_stages) {
    try {
      const parsed = JSON.parse(row.key_stages) as unknown;
      if (Array.isArray(parsed)) keyStages = parsed.filter((x) => typeof x === "string");
    } catch {
      // ignore parse errors; treat as empty
    }
  }

  return {
    name: row.name ?? "",
    email: row.email ?? "",
    career_stage: row.career_stage ?? "",
    subject_specialism: row.subject_specialism ?? "",
    key_stages: keyStages,
    teaching_philosophy: row.teaching_philosophy ?? "",
    evidence_bank: row.evidence_bank ?? "",
    safeguarding: row.safeguarding ?? "",
    extracurricular: row.extracurricular ?? "",
    updated_at: row.updated_at,
  };
}

export function upsertProfile(input: Profile) {
  const keyStagesJson = JSON.stringify(
    (input.key_stages ?? []).filter((x) => typeof x === "string" && x.trim().length > 0),
  );

  db()
    .prepare(
      `UPDATE profile
       SET
         name = @name,
         email = @email,
         career_stage = @career_stage,
         subject_specialism = @subject_specialism,
         key_stages = @key_stages,
         teaching_philosophy = @teaching_philosophy,
         evidence_bank = @evidence_bank,
         safeguarding = @safeguarding,
         extracurricular = @extracurricular,
         updated_at = datetime('now')
       WHERE id = 1`,
    )
    .run({
      name: input.name ?? "",
      email: input.email ?? "",
      career_stage: input.career_stage ?? "",
      subject_specialism: input.subject_specialism ?? "",
      key_stages: keyStagesJson,
      teaching_philosophy: input.teaching_philosophy ?? "",
      evidence_bank: input.evidence_bank ?? "",
      safeguarding: input.safeguarding ?? "",
      extracurricular: input.extracurricular ?? "",
    });
}

