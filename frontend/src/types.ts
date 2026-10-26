export type UserRole = "user" | "agent" | "manager";

export interface User {
  id: string | number;
  email: string;
  full_name?: string;
  fullName?: string;
  role?: UserRole;
  role_name?: UserRole;
  is_blocked?: boolean;
}

export type TicketStatus =
  | "new"
  | "in_progress"
  | "waiting"
  | "resolved"
  | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Ticket {
  id: string | number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  author_id?: string | number;
  assignee_id?: string | number | null;
  category_id?: string | number | null;
  created_at?: string;
  updated_at?: string;
}

export interface TicketComment {
  id: string | number;
  ticket_id: string | number;
  author_id?: string | number | null;
  body: string;
  created_at?: string;
}