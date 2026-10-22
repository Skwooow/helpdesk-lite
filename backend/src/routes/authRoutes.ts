
import { authenticateToken } from "../middleware/authMiddleware";
import { Router } from "express";
import {
  registerController,
  loginController,
  refreshController,
  logoutController,
} from "../controllers/authController";

// Создаём маршруты для регистрации и авторизации.
const authRouter = Router();

// POST /register — регистрация нового пользователя.
authRouter.post("/register", registerController);

// POST /login — вход в аккаунт.
authRouter.post("/login", loginController);

// POST /refresh — обновление пары токенов.
authRouter.post("/refresh", refreshController);

// POST /logout — выход из аккаунта.
authRouter.post("/logout", logoutController);

// GET /me — получение данных текущего пользователя.
authRouter.get("/me", authenticateToken, (request, response) => {
  response.json({
    user: request.user,
  });
});

export default authRouter;
