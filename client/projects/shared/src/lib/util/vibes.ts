import { Reminder, ReminderPriority } from '../api/models';

/** Brand copy lives here so the web and mobile apps sound the same. */
export const BRAND = {
  name: 'gurtundaa?',
  emoji: '💭',
  tagline: 'your memory bestie',
} as const;

export const PRIORITY_LABELS: Record<ReminderPriority, string> = {
  Chill: 'chill 🧊',
  Normal: 'normal ✌️',
  Urgent: 'urgent 🔥',
};

export function greeting(name: string | undefined, now = new Date()): string {
  const hour = now.getHours();
  const who = name ? name.split(' ')[0].toLowerCase() : 'bestie';
  if (hour < 5) return `still up, ${who}? 🌙`;
  if (hour < 12) return `gm ${who} ☀️`;
  if (hour < 17) return `hey ${who} 👋`;
  if (hour < 21) return `evening ${who} 🌆`;
  return `winding down, ${who}? 🌙`;
}

/** "in 2h", "tmrw 9:00", "overdue by 3d" … short enough for a list row. */
export function dueLabel(reminder: Pick<Reminder, 'dueAt' | 'isDone'>, now = new Date()): string {
  if (!reminder.dueAt) return 'whenever ✨';

  const due = new Date(reminder.dueAt);
  const diffMs = due.getTime() - now.getTime();
  const abs = Math.abs(diffMs);
  const minutes = Math.round(abs / 60_000);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  const span = minutes < 60 ? `${Math.max(minutes, 1)}m` : hours < 24 ? `${hours}h` : `${days}d`;

  if (diffMs < 0) {
    return reminder.isDone ? `was due ${span} ago` : `overdue by ${span} 👀`;
  }
  if (isTomorrow(due, now)) {
    return `tmrw ${due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }
  return `in ${span}`;
}

export function isOverdue(reminder: Pick<Reminder, 'dueAt' | 'isDone'>, now = new Date()): boolean {
  return !reminder.isDone && !!reminder.dueAt && new Date(reminder.dueAt).getTime() < now.getTime();
}

export function emptyStateLine(filter: string): string {
  switch (filter) {
    case 'Overdue':
      return "nothing overdue. you're literally thriving 💅";
    case 'Done':
      return 'nothing done yet… no pressure tho 🫶';
    case 'Upcoming':
      return 'calendar clear. touch grass 🌱';
    default:
      return 'no reminders yet. what are we not forgetting today?';
  }
}

export const DONE_CHEERS = ['ate that 💅', 'slay ✅', 'main character energy ✨', 'one less thing 🫡', 'W 🏆'];

export function randomCheer(): string {
  return DONE_CHEERS[Math.floor(Math.random() * DONE_CHEERS.length)];
}

/** `<input type="datetime-local">` value <-> ISO string with the user's offset. */
export function toLocalInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromLocalInputValue(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

function isTomorrow(date: Date, now: Date): boolean {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}
