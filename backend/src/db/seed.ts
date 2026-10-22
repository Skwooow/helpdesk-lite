import { pool } from "./pool";

async function seedDatabase(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`
      INSERT INTO roles (name)
      VALUES ('user'), ('agent'), ('manager')
      ON CONFLICT (name) DO NOTHING
    `);

    await client.query(
      `
        INSERT INTO categories (name, description)
        VALUES
          ($1, $2),
          ($3, $4),
          ($5, $6),
          ($7, $8)
        ON CONFLICT (name) DO NOTHING
      `,
      [
        "Оборудование",
        "Компьютеры, периферия и другое оборудование",
        "Программное обеспечение",
        "Установка, настройка и ошибки программ",
        "Доступы и учётные записи",
        "Учётные записи и права доступа",
        "Другое",
        "Прочие технические вопросы",
      ],
    );

    await client.query("COMMIT");
    console.log("Seed completed: roles and categories are ready.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
});