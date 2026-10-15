// Mirrors the DTOs in server/src/Gurtundaa.Application. Keep the two in sync.

export type ReminderPriority = 'Chill' | 'Normal' | 'Urgent';

export type ReminderFilter = 'All' | 'Upcoming' | 'Overdue' | 'Done';

export interface Reminder {
  id: string;
  title: string;
  notes: string | null;
  dueAt: string | null;
  priority: ReminderPriority;
  isDone: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveReminderRequest {
  title: string;
  notes?: string | null;
  dueAt?: string | null;
  priority: ReminderPriority;
}

export interface ReminderStats {
  total: number;
  upcoming: number;
  overdue: number;
  doneToday: number;
  done: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  displayName: string;
}
