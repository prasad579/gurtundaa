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
  phoneNumber: string | null;
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
  phoneNumber: string;
}

export interface RequestOtpRequest {
  phoneNumber: string;
}

export interface RequestOtpResponse {
  sent: boolean;
  devCode: string | null;
}

export interface VerifyOtpRequest {
  phoneNumber: string;
  code: string;
}

export interface HouseholdProfile {
  accountType: string;
  adults: number;
  children: number;
  city: string | null;
  enabledFeatures: string[];
}

export type SaveHouseholdProfileRequest = HouseholdProfile;

// ---------- Service contacts (general household directory) ----------

export type ServiceContactCategory = 'Milk' | 'Laundry' | 'Electrician' | 'Plumber' | 'Family' | 'Other';

export interface ServiceContact {
  id: string;
  category: ServiceContactCategory;
  name: string;
  phone: string;
  address: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface SaveServiceContactRequest {
  category: ServiceContactCategory;
  name: string;
  phone: string;
  address?: string | null;
  isDefault?: boolean;
}

// ---------- Milk management ----------

export type MilkSettlementCycle = 'Monthly';

export type MilkSlot = 'Morning' | 'Evening';

export interface MilkSubscription {
  contactId: string | null;
  contactName: string | null;
  contactPhone: string | null;
  morningEnabled: boolean;
  morningQuantityLtr: number;
  morningWindowStart: string | null;
  morningWindowEnd: string | null;
  eveningEnabled: boolean;
  eveningQuantityLtr: number;
  eveningWindowStart: string | null;
  eveningWindowEnd: string | null;
  ratePerLtr: number;
  settlementCycle: MilkSettlementCycle;
  updatedAt: string;
}

export interface SaveMilkSubscriptionRequest {
  contactId?: string | null;
  morningEnabled: boolean;
  morningQuantityLtr: number;
  morningWindowStart?: string | null;
  morningWindowEnd?: string | null;
  eveningEnabled: boolean;
  eveningQuantityLtr: number;
  eveningWindowStart?: string | null;
  eveningWindowEnd?: string | null;
  ratePerLtr: number;
  settlementCycle?: MilkSettlementCycle;
}

export type MilkCalendarStatus = 'Delivered' | 'Missed' | 'Paused';

export interface MilkSlotState {
  enabled: boolean;
  status: MilkCalendarStatus;
  quantityLtr: number;
  hasExtra: boolean;
}

export interface MilkCalendarDay {
  date: string;
  status: MilkCalendarStatus;
  morning: MilkSlotState;
  evening: MilkSlotState;
}

export interface MilkMonthSummary {
  planned: number;
  delivered: number;
  paused: number;
  missed: number;
}

export interface MilkMonth {
  days: MilkCalendarDay[];
  summary: MilkMonthSummary;
}

export interface MilkToday {
  date: string;
  morning: MilkSlotState;
  evening: MilkSlotState;
  isAuto: boolean;
}

export type MilkDeliveryStatus = 'Delivered' | 'Missed';

export interface SetMilkDeliveryOverrideRequest {
  slot: MilkSlot;
  status: MilkDeliveryStatus;
  quantityLtr?: number | null;
  note?: string | null;
}

export interface MilkPause {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  createdAt: string;
}

export interface SaveMilkPauseRequest {
  startDate: string;
  endDate: string;
  reason?: string | null;
}

export interface MilkQuantityChange {
  id: string;
  startDate: string;
  endDate: string;
  morningQuantityLtr: number;
  eveningQuantityLtr: number;
  reason: string | null;
  createdAt: string;
}

export interface SaveMilkQuantityChangeRequest {
  startDate: string;
  endDate: string;
  morningQuantityLtr: number;
  eveningQuantityLtr: number;
  reason?: string | null;
}

export interface MilkExtraRequestItem {
  id: string;
  date: string;
  slot: MilkSlot;
  quantityLtr: number;
  reason: string | null;
  createdAt: string;
}

export interface SaveMilkExtraRequestRequest {
  date: string;
  slot: MilkSlot;
  quantityLtr: number;
  reason?: string | null;
}

export type MilkActivityType = 'Delivered' | 'Missed' | 'ExtraAdded' | 'Paused';

export interface MilkActivityItem {
  type: MilkActivityType;
  description: string;
  date: string;
  quantityLtr: number | null;
  occurredAt: string;
}

// ---------- Laundry management ----------

export type LaundryBatchStatus = 'Active' | 'PickedUp';

export type LaundryServiceType = 'Ironing' | 'WashAndIron' | 'DryClean' | 'Other';

export interface LaundryItemLine {
  itemType: string;
  quantity: number;
  pricePerItem?: number | null;
}

export interface LaundryBatch {
  id: string;
  contactId: string | null;
  contactName: string | null;
  contactPhone: string | null;
  serviceType: LaundryServiceType;
  givenOn: string;
  expectedReturn: string | null;
  status: LaundryBatchStatus;
  pickedUpOn: string | null;
  amount: number | null;
  items: LaundryItemLine[];
  notes: string | null;
  createdAt: string;
}

export interface SaveLaundryBatchRequest {
  contactId?: string | null;
  serviceType: LaundryServiceType;
  givenOn: string;
  expectedReturn?: string | null;
  items: LaundryItemLine[];
  notes?: string | null;
}

export interface MarkPickedUpRequest {
  amount?: number | null;
  items?: LaundryItemLine[] | null;
}
