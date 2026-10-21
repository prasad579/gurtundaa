import { Bill, BillCategory, BillRecurrence, LaundryServiceType, MilkCalendarStatus, MilkSlot, Reminder, ReminderPriority } from '../api/models';

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

// ---------- WhatsApp sharing (shared across every module — Milk, Laundry, and any future add-on) ----------

export function waLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}`;
}

/** Opens WhatsApp (app or web) with `message` pre-filled for `phone`. */
export function shareOnWhatsApp(phone: string, message: string): void {
  window.open(`${waLink(phone)}?text=${encodeURIComponent(message)}`, '_blank');
}

/** Opens WhatsApp with `message` pre-filled but no fixed recipient — the user picks any chat/contact themselves. */
export function shareOnWhatsAppAny(message: string): void {
  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
}

/** "18 min", "1 hr 40", or "Closed" for a quotes-close countdown — null input means no deadline set. */
export function countdownLabel(closeAt: string | null, now = new Date()): string | null {
  if (!closeAt) return null;
  const msLeft = new Date(closeAt).getTime() - now.getTime();
  if (msLeft <= 0) return 'Closed';
  const totalMinutes = Math.ceil(msLeft / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} hr ${minutes}` : `${minutes} min`;
}

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

// ---------- Milk management ----------

export const MILK_STATUS_LABELS: Record<MilkCalendarStatus, string> = {
  Delivered: 'Delivered ✅',
  Missed: 'Missed ❌',
  Paused: 'Paused ⏸️',
};

export const MILK_SLOT_LABELS: Record<MilkSlot, string> = {
  Morning: '🌅 Morning',
  Evening: '🌙 Evening',
};

export function litresLabel(quantity: number): string {
  return `${quantity.toFixed(1)} Ltr`;
}

/** Parses a `DateOnly` string (`yyyy-MM-dd`) as a local calendar date, avoiding UTC off-by-one. */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function shortDateLabel(value: string): string {
  return parseDateOnly(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', weekday: 'short' });
}

/** True for any `DateOnly` string strictly after today — used to tell "planned" from "already happened". */
export function isFutureDate(value: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDateOnly(value).getTime() > today.getTime();
}

export function toDateOnlyString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function pauseRangeLabel(startDate: string, endDate: string): string {
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return startDate === endDate ? `${fmt(start)} (1 day)` : `${fmt(start)} – ${fmt(end)} (${days} days)`;
}

/** Formats a `TimeOnly` string (`HH:mm:ss`) as `6:00 AM`. */
export function timeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export function deliveryWindowLabel(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  if (start && end) return `${timeLabel(start)} – ${timeLabel(end)} · Daily`;
  return `${timeLabel((start ?? end)!)} · Daily`;
}

export function timeOfDayLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function rupeeLabel(amount: number): string {
  return `₹${Math.round(amount)}`;
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitWords(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones ? `${TENS[tens]} ${ONES[ones]}` : TENS[tens];
}

function threeDigitWords(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest) parts.push(twoDigitWords(rest));
  return parts.join(' ');
}

/** Classic Indian invoice convention, e.g. 3477 -> "Three Thousand Four Hundred Seventy Seven Rupees Only". */
export function rupeesInWords(amount: number): string {
  const n = Math.round(amount);
  if (n === 0) return 'Zero Rupees Only';

  const crore = Math.floor(n / 1_00_00_000);
  const lakh = Math.floor((n % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((n % 1_00_000) / 1000);
  const hundred = n % 1000;

  const parts: string[] = [];
  if (crore) parts.push(`${threeDigitWords(crore)} Crore`);
  if (lakh) parts.push(`${threeDigitWords(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigitWords(thousand)} Thousand`);
  if (hundred) parts.push(threeDigitWords(hundred));

  return `${parts.join(' ')} Rupees Only`;
}

// ---------- Laundry management ----------

export const LAUNDRY_SERVICE_TYPE_LABELS: Record<LaundryServiceType, string> = {
  Ironing: '🧺 Ironing',
  WashAndIron: '🧼 Wash & Iron',
  DryClean: '✨ Dry Clean',
  Other: '🧵 Other',
};

// ---------- Bills & subscriptions ----------

export const BILL_CATEGORY_LABELS: Record<BillCategory, { icon: string; label: string }> = {
  Electricity: { icon: '⚡', label: 'Electricity' },
  Water: { icon: '💧', label: 'Water' },
  Phone: { icon: '📱', label: 'Phone' },
  Internet: { icon: '🌐', label: 'Internet' },
  CreditCard: { icon: '💳', label: 'Credit Card' },
  Rent: { icon: '🏠', label: 'Rent' },
  Insurance: { icon: '🛵', label: 'Insurance' },
  Subscription: { icon: '📺', label: 'Subscription' },
  Other: { icon: '📄', label: 'Other' },
};

export const BILL_RECURRENCE_LABELS: Record<BillRecurrence, string> = {
  OneTime: 'One-time',
  Monthly: 'Monthly',
  Quarterly: 'Quarterly',
  Yearly: 'Yearly',
};

export type BillUrgency = 'Overdue' | 'DueSoon' | 'Upcoming';

/** "Due Soon" = within a week — matches the grouping shown on the Bills home screen. */
export function billUrgency(dueDate: string, now = new Date()): BillUrgency {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = parseDateOnly(dueDate);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return 'Overdue';
  if (days <= 7) return 'DueSoon';
  return 'Upcoming';
}

/** "Overdue by 2 days", "Due today", "Due in 3 days", "Renews in 54 days" (for yearly/quarterly bills). */
export function billDueLabel(bill: Pick<Bill, 'dueDate' | 'recurrence'>, now = new Date()): string {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = parseDateOnly(bill.dueDate);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  const verb = bill.recurrence === 'OneTime' || bill.recurrence === 'Monthly' ? 'Due' : 'Renews';

  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`;
  if (days === 0) return `${verb} today`;
  return `${verb} in ${days} day${days === 1 ? '' : 's'}`;
}
