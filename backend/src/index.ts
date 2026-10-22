
import "dotenv/config";
import app from "./app";

const PORT = 3000;

// Запускаем сервер.
app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
