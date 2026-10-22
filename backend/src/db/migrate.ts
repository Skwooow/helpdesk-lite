import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool";

async function runMigrations(): Promise<void> {
  const migrationsDirectory = path.resolve(process.cwd(), "migrations");

  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = (await readdir(migrationsDirectory))
      .filter((file) => /^\d+_.+\.sql$/.test(file))
      .sort();

    for (const filename of files) {
      const result = await client.query(
        "SELECT filename FROM schema_migrations WHERE filename = $1",
        [filename],
      );

      if (result.rowCount && result.rowCount > 0) {
        console.log(`Already applied: ${filename}`);
        continue;
      }

      const filePath = path.join(migrationsDirectory, filename);
      const sql = await readFile(filePath, "utf8");

      console.log(`Applying migration: ${filename}`);

      await client.query("BEGIN");

      try {
        await client.query(sql);

        await client.query(
          "INSERT INTO schema_migrations (filename) VALUES ($1)",
          [filename],
        );

        await client.query("COMMIT");
        console.log(`Applied successfully: ${filename}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    console.log("Migrations completed.");
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error: unknown) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});