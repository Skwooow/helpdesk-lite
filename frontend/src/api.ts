
import type { Ticket, TicketComment, User } from "./types";

const API_URL = "http://localhost:3000/api";
const TOKEN_KEY = "helpdesk_access_token";
const REFRESH_TOKEN_KEY = "helpdesk_refresh_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const body =
      data && typeof data === "object"
        ? (data as { message?: string; error?: string })
        : null;

    if (response.status === 401) {
      clearToken();
    }

    throw new Error(
      body?.message ||
        body?.error ||
        `Ошибка запроса (${response.status})`,
    );
  }

  return data as T;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function unwrap(value: unknown): Record<string, unknown> {
  let result = asRecord(value);

  for (let i = 0; i < 3; i += 1) {
    const nested = result.data ?? result.result;

    if (!nested || typeof nested !== "object") {
      break;
    }

    result = asRecord(nested);
  }

  return result;
}

function extractArray<T>(value: unknown, keys: string[]): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  const result = unwrap(value);

  for (const key of keys) {
    if (Array.isArray(result[key])) {
      return result[key] as T[];
    }
  }

  return [];
}

export async function login(
  email: string,
  password: string,
): Promise<User> {
  const result = await request<unknown>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const data = unwrap(result);
  const tokens = asRecord(data.tokens);

  const accessToken =
    data.accessToken ??
    data.access_token ??
    tokens.accessToken ??
    tokens.access_token;

  const refreshToken =
    data.refreshToken ??
    data.refresh_token ??
    tokens.refreshToken ??
    tokens.refresh_token;

  if (typeof accessToken !== "string") {
    throw new Error("Сервер не вернул access-токен.");
  }

  saveToken(accessToken);

  if (typeof refreshToken === "string") {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  try {
    return await getProfile();
  } catch (error) {
    clearToken();
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    throw error;
  }
}

export async function getProfile(): Promise<User> {
  const result = await request<unknown>("/users/me");
  const data = unwrap(result);
  const user = (data.user ?? data.profile ?? data) as User;

  if (!user || !user.email) {
    throw new Error("Не удалось получить профиль пользователя.");
  }

  return user;
}

export async function logout(): Promise<void> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  try {
    await request("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    clearToken();
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export async function getTickets(): Promise<Ticket[]> {
  const result = await request<unknown>("/tickets");

  // Backend возвращает список в поле items.
  return extractArray<Ticket>(result, ["items", "tickets"]);
}

export async function getTicket(id: string): Promise<Ticket> {
  const result = await request<unknown>(
    `/tickets/${encodeURIComponent(id)}`,
  );

  const data = unwrap(result);
  const ticket = (data.ticket ?? data) as Ticket;

  if (!ticket || ticket.id === undefined) {
    throw new Error("Сервер вернул некорректные данные заявки.");
  }

  return ticket;
}

export async function createTicket(input: {
  title: string;
  description: string;
  priority: string;
}): Promise<Ticket> {
  const result = await request<unknown>("/tickets", {
    method: "POST",
    body: JSON.stringify(input),
  });

  const data = unwrap(result);
  const ticket = (data.ticket ?? data) as Ticket;

  if (!ticket || ticket.id === undefined) {
    throw new Error("Заявка создана, но сервер не вернул её данные.");
  }

  return ticket;
}

export async function getComments(
  ticketId: string,
): Promise<TicketComment[]> {
  const result = await request<unknown>(
    `/tickets/${encodeURIComponent(ticketId)}/comments`,
  );

  return extractArray<TicketComment>(result, ["comments", "items"]);
}

export async function addComment(
  ticketId: string,
  body: string,
): Promise<void> {
  await request(
    `/tickets/${encodeURIComponent(ticketId)}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ body }),
    },
  );
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
): Promise<void> {
  await request(
    `/tickets/${encodeURIComponent(ticketId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}
