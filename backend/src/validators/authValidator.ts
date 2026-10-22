import { z } from "zod";

// Проверяем данные, которые пользователь отправляет при регистрации.
export const registrationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Введите корректный адрес электронной почты.")
    .max(254, "Адрес электронной почты слишком длинный.")
    .transform((email) => email.toLowerCase()),

  fullName: z
    .string()
    .trim()
    .min(2, "Имя должно содержать не менее 2 символов.")
    .max(150, "Имя слишком длинное."),

  password: z
    .string()
    .min(8, "Пароль должен содержать не менее 8 символов.")
    .max(72, "Пароль не должен превышать 72 символа."),
});

export type RegistrationData = z.infer<typeof registrationSchema>;


 // Проверяем данные, которые пользователь отправляет при входе.
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Введите корректный адрес электронной почты.")
    .max(254, "Адрес электронной почты слишком длинный.")
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(1, "Введите пароль.")
    .max(72, "Неверный email или пароль."),
});

export type LoginData = z.infer<typeof loginSchema>;

// Проверяем токен, который клиент отправляет для обновления или выхода.
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Необходимо передать токен обновления."),
});