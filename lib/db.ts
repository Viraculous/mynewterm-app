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

  // Ensure a single row exists.
  _db
    .prepare(
      `INSERT OR IGNORE INTO profile (id, updated_at) VALUES (1, datetime('now'))`,
    )
    .run();

  return _db;
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

