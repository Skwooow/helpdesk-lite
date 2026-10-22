
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { pool } from "./db/pool";
import authRoutes from "./routes/authRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();


// Добавляем защитные HTTP-заголовки.
app.use(helmet());

// Разрешаем запросы с локального адреса фронтенда.
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

// Разбираем JSON в теле запроса. Ограничиваем размер до 1 МБ.
app.use(express.json({ limit: "1mb" }));

// Подключаем маршруты регистрации и авторизации.
app.use("/api/auth", authRoutes);

app.use("/api/tickets", ticketRoutes);

app.use("/api/users", userRoutes);

// Ограничиваем количество запросов с одного IP-адреса.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

// Проверяем, что API запущен.
app.get("/", (_request, response) => {
  response.json({
    message: "API Helpdesk Lite работает!",
  });
});

// Проверяем доступность базы данных.
app.get("/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");

    response.json({
      status: "ok",
      database: "подключена",
    });
  } catch (error) {
    console.error("Ошибка проверки базы данных:", error);

    response.status(503).json({
      status: "error",
      database: "недоступна",
    });
  }
});

export default app;
