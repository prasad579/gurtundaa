import { dueLabel, fromLocalInputValue, greeting, isOverdue, toLocalInputValue } from './vibes';

describe('vibes', () => {
  const now = new Date(2026, 9, 15, 10, 0, 0);
  const at = (offsetMs: number) => new Date(now.getTime() + offsetMs).toISOString();
  const hour = 3_600_000;

  it('labels reminders with no due date', () => {
    expect(dueLabel({ dueAt: null, isDone: false }, now)).toBe('whenever ✨');
  });

  it('labels upcoming reminders in minutes and hours', () => {
    expect(dueLabel({ dueAt: at(30 * 60_000), isDone: false }, now)).toBe('in 30m');
    expect(dueLabel({ dueAt: at(3 * hour), isDone: false }, now)).toBe('in 3h');
  });

  it('labels tomorrow with a time', () => {
    expect(dueLabel({ dueAt: at(24 * hour), isDone: false }, now)).toMatch(/^tmrw /);
  });

  it('calls out overdue reminders but not finished ones', () => {
    expect(dueLabel({ dueAt: at(-2 * 24 * hour), isDone: false }, now)).toBe('overdue by 2d 👀');
    expect(dueLabel({ dueAt: at(-2 * 24 * hour), isDone: true }, now)).toBe('was due 2d ago');
    expect(isOverdue({ dueAt: at(-hour), isDone: false }, now)).toBe(true);
    expect(isOverdue({ dueAt: at(-hour), isDone: true }, now)).toBe(false);
    expect(isOverdue({ dueAt: null, isDone: false }, now)).toBe(false);
  });

  it('greets by time of day using the first name', () => {
    expect(greeting('Prasad Yalla', new Date(2026, 9, 15, 8))).toBe('gm prasad ☀️');
    expect(greeting(undefined, new Date(2026, 9, 15, 14))).toBe('hey bestie 👋');
  });

  it('round-trips datetime-local values', () => {
    const iso = new Date(2026, 9, 15, 18, 30).toISOString();
    expect(toLocalInputValue(iso)).toBe('2026-10-15T18:30');
    expect(fromLocalInputValue('2026-10-15T18:30')).toBe(iso);
    expect(fromLocalInputValue('')).toBeNull();
  });
});
