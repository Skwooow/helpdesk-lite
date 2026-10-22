import { pool } from "./db/pool";

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");

    console.log("Успешное подключение к PostgreSQL!");
    console.log("Время базы данных:", result.rows[0].now);
  } catch (error) {
    console.error("Ошибка подключения к PostgreSQL:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

testConnection();
