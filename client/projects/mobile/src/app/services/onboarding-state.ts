import { Injectable, signal } from '@angular/core';

export type AccountType = 'Family' | 'Individual' | 'Parents' | 'HouseholdManager';

export const ACCOUNT_TYPES: { value: AccountType; label: string; hint: string; icon: string }[] = [
  { value: 'Family', label: 'Family', hint: 'Manage your entire family in one place', icon: '👨‍👩‍👧' },
  { value: 'Individual', label: 'Individual', hint: 'Manage your personal reminders and tasks', icon: '🧑' },
  { value: 'Parents', label: 'Parents', hint: "Stay on top of your family's needs", icon: '👴' },
  { value: 'HouseholdManager', label: 'Household Manager', hint: 'Manage the household for others', icon: '🏠' },
];

export const FEATURE_OPTIONS = [
  { key: 'bills', label: 'Bills', hint: 'Track & pay bills on time', icon: '🧾' },
  { key: 'medicines', label: 'Medicines', hint: 'Reminders & refill alerts', icon: '💊' },
  { key: 'documents', label: 'Documents', hint: 'Store & track important docs', icon: '📁' },
  { key: 'school', label: 'School', hint: 'School fees, exams & reminders', icon: '🎓' },
  { key: 'milk', label: 'Milk', hint: 'Milk delivery & settlement', icon: '🥛' },
  { key: 'laundry', label: 'Laundry', hint: 'Laundry tracking & reminders', icon: '🧺' },
  { key: 'marketplace', label: 'Marketplace', hint: 'Get quotes from shops for groceries', icon: '🛒' },
  { key: 'finance', label: 'Finance', hint: 'Expenses, FD & renewals', icon: '💰' },
  { key: 'essentials', label: 'Essentials', hint: 'Home utilities & smart alerts', icon: '🏡' },
] as const;

export type FeatureKey = (typeof FEATURE_OPTIONS)[number]['key'];

const DEFAULT_FEATURES = () => new Set<FeatureKey>(FEATURE_OPTIONS.map((f) => f.key));

/**
 * Holds in-progress onboarding answers for the signed-in session only — nothing
 * is persisted to the backend yet. The wizard is entirely skippable; this just
 * remembers what was picked if the user clicks back and forth between steps.
 */
@Injectable({ providedIn: 'root' })
export class OnboardingState {
  readonly accountType = signal<AccountType>('Family');
  readonly adults = signal(2);
  readonly children = signal(2);
  readonly enabledFeatures = signal<Set<FeatureKey>>(DEFAULT_FEATURES());
  readonly city = signal('');

  toggleFeature(key: FeatureKey): void {
    this.enabledFeatures.update((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }
}
