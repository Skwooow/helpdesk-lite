import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(150),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(8).max(72),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["user", "agent", "manager"]),
});

export const updateUserBlockSchema = z.object({
  isBlocked: z.boolean(),
});