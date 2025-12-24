import { Client } from "pg";
import { createSemanticDiagnosticsBuilderProgram } from "typescript";

const postgresPassword = process.env.POSTGRES_PASSWORD ?? "password";

// hardcode for now
const client = new Client({
  user: "thankful",
  password: postgresPassword,
  host: "db",
  port: 5432,
  database: "thankful",
});

await client.connect();

// kians egrass bot has an example of versioning the database
await client.query(
  `CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY NOT NULL
)`,
);

interface SchemaVersionRow {
  version: number;
}

const versionRows = (
  await client.query<SchemaVersionRow>(`SELECT version FROM schema_version`)
).rows;
const version = versionRows[0]?.version ?? 0;
const now = new Date();
console.log(now.toTimeString(), ": version", version);

export interface NotebookEntry {
  id: string;
  user_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

if (version < 1) {
  // next time should be UPDATE, not INSERT
  await client.query(`INSERT INTO schema_version (version) VALUES (1)`);

  await client.query(`CREATE TABLE IF NOT EXISTS notebook_entries (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
  );`);

  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_notebook_entries_user_id ON notebook_entries (user_id);`,
  );
  await client.query(
    `CREATE INDEX IF NOT EXISTS idx_notebook_entries_created_at ON notebook_entries (created_at);`,
  );
}

export async function createNotebookEntry(
  user_id: string,
  title: string,
): Promise<NotebookEntry> {
  const result = await client.query<NotebookEntry>(
    `
    INSERT INTO notebook_entries (user_id, title)
    VALUES ($1, $2)
    RETURNING *;`,
    [user_id, title],
  );
  const entry = result.rows[0];
  return entry;
}

export async function getNotebookEntries(
  user_id: string,
): Promise<NotebookEntry[]> {
  const result = await client.query<NotebookEntry>(
    `
    SELECT id, user_id, title, created_at, updated_at, deleted_at
    FROM notebook_entries
    WHERE user_id = $1 AND deleted_at IS NULL
    ORDER BY created_at DESC;
  `,
    [user_id],
  );
  return result.rows;
}
