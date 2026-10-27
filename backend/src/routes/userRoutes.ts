
import { Router } from "express";
import { authenticateToken, allowRoles } from "../middleware/authMiddleware";
import {
  changeMyPasswordController,
  getMyProfileController,
  listUsersController,
  updateMyProfileController,
  updateUserBlockController,
  updateUserRoleController,
} from "../controllers/userController";

const userRouter = Router();

userRouter.use(authenticateToken);

// Профиль и пароль доступны авторизованному пользователю.
userRouter.get("/me", getMyProfileController);
userRouter.patch("/me", updateMyProfileController);
userRouter.patch("/me/password", changeMyPasswordController);

// Управление пользователями доступно только менеджеру.
userRouter.use(allowRoles("agent"));

userRouter.get("/", listUsersController);
userRouter.patch("/:id/role", updateUserRoleController);
userRouter.patch("/:id/block", updateUserBlockController);

export default userRouter;
