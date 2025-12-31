import { Client } from "pg";
import { createSemanticDiagnosticsBuilderProgram } from "typescript";

// hardcode for now
const client = new Client(
  process.env.POSTGRES_CONN_STRING ?? {
    user: "thankful",
    password: "password",
    host: "db",
    port: 5432,
    database: "thankful",
  },
);

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
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
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

if (version < 2) {
  await client.query(`UPDATE schema_version SET version = 2`);

  await client.query(`
    ALTER TABLE notebook_entries
    RENAME COLUMN user_id TO "userId";
    `);
  await client.query(`
    ALTER TABLE notebook_entries
    RENAME COLUMN created_at TO "createdAt";
    `);
  await client.query(`
    ALTER TABLE notebook_entries
    RENAME COLUMN updated_at TO "updatedAt";
    `);
  await client.query(`
    ALTER TABLE notebook_entries
    RENAME COLUMN deleted_at TO "deletedAt";
    `);
}

export async function getNotebookEntries(
  userId: string,
): Promise<NotebookEntry[]> {
  try {
    const result = await client.query<NotebookEntry>(
      `
      SELECT "id", "userId", "title", "createdAt", "updatedAt", "deletedAt"
      FROM notebook_entries
      WHERE "userId" = $1 AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC;
      `,
      [userId],
    );
    return result.rows;
  } catch (err) {
    console.error(err);
  }
  return [];
}

export async function createNotebookEntry(
  userId: string,
  title: string,
): Promise<NotebookEntry[]> {
  try {
    const result = await client.query<NotebookEntry>(
      `
      INSERT INTO notebook_entries ("userId", "title")
      VALUES ($1, $2)
      RETURNING "id", "userId", "title", "createdAt", "updatedAt", "deletedAt";
      `,
      [userId, title],
    );
    return result.rows;
  } catch (err) {
    console.error(err);
  }
  return [];
}

export async function deleteNotebookEntry(
  userId: string,
  entryId: string,
): Promise<NotebookEntry[]> {
  try {
    const result = await client.query<NotebookEntry>(
      `
    DELETE FROM notebook_entries WHERE
    "userId" = $1 AND "id" = $2
    RETURNING "id", "userId", "title", "createdAt", "updatedAt", "deletedAt";
    `,
      [userId, entryId],
    );
    return result.rows;
  } catch (err) {
    console.error(err);
  }
  return [];
}
