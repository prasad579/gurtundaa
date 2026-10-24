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

export type UserType = 'Customer' | 'Shop' | 'MilkProvider' | 'LaundryProvider';

export interface User {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string | null;
  userType: UserType;
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
  userType?: UserType;
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

// ---------- Shop profile (marketplace shop accounts) ----------

export type DayOfWeekName = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface ShopProfile {
  shopName: string;
  city: string | null;
  address: string | null;
  servedCategoryKeys: string[];
  imageUrl: string | null;
  contactPhones: string[];
  /** "HH:mm:ss" (server TimeOnly serialized form), or null if not set. */
  opensAt: string | null;
  closesAt: string | null;
  openDays: DayOfWeekName[];
  latitude: number | null;
  longitude: number | null;
}

export type SaveShopProfileRequest = ShopProfile;

export interface UploadShopImageResponse {
  imageUrl: string;
}

// ---------- Service contacts (general household directory) ----------

export type ServiceContactCategory = 'Milk' | 'Laundry' | 'Electrician' | 'Plumber' | 'Family' | 'Other' | 'Shop';

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
  isSelfCollected: boolean;
  startDate: string;
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
  isSelfCollected: boolean;
  startDate: string;
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
  regularLitres: number;
  extraLitres: number;
  ratePerLtr: number;
  regularAmount: number;
  extraAmount: number;
  totalAmount: number;
  isPaid: boolean;
  paidSoFar: number;
  paidAt: string | null;
}

export interface MilkMonth {
  days: MilkCalendarDay[];
  summary: MilkMonthSummary;
}

export type PaymentMethod = 'Cash' | 'Upi' | 'Other';
export type PaymentStatus = 'Confirmed' | 'AwaitingConfirmation' | 'Rejected';

export interface MilkPayment {
  id: string;
  date: string;
  amount: number;
  note: string | null;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
}

export interface SaveMilkPaymentRequest {
  date: string;
  amount: number;
  note?: string | null;
}

// ---------- Direct UPI payments ----------

export interface MilkProviderPaymentInfo {
  providerDisplayName: string | null;
  upiId: string | null;
}

export interface InitiateUpiPaymentRequest {
  amount: number;
  note?: string | null;
}

export interface PendingMilkPayment {
  id: string;
  householdUserId: string;
  householdName: string;
  date: string;
  amount: number;
  note: string | null;
  createdAt: string;
}

export interface ProviderPaymentSettings {
  upiId: string | null;
}

export interface SaveProviderPaymentSettingsRequest {
  upiId: string | null;
}

export interface SetMilkSettlementPaidRequest {
  isPaid: boolean;
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
  addedByProviderName: string | null;
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
  addedByProviderName: string | null;
}

// ---------- Laundry management ----------

export type LaundryBatchStatus = 'Active' | 'PickedUp';

export type LaundryServiceType = 'Ironing' | 'WashAndIron' | 'DryClean' | 'Other';

export interface LaundryItemLine {
  itemType: string;
  quantity: number;
  pricePerItem?: number | null;
  /** Flags this specific item for an earlier pickup than the rest of the batch (e.g. school uniform needed sooner). */
  neededBy?: string | null;
  /** Per-item settlement, for batches paid off in stages. The batch's own isPaid is derived from this. */
  isPaid?: boolean;
}

export interface SetLaundryItemPaidRequest {
  isPaid: boolean;
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
  isPaid: boolean;
  paidAt: string | null;
  items: LaundryItemLine[];
  notes: string | null;
  photoUrl: string | null;
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

export interface SetLaundryPaidRequest {
  isPaid: boolean;
}

export interface MarkPickedUpRequest {
  amount?: number | null;
  items?: LaundryItemLine[] | null;
}

// ---------- Bills & subscriptions ----------

export type BillCategory =
  | 'Electricity'
  | 'Water'
  | 'Phone'
  | 'Internet'
  | 'CreditCard'
  | 'Rent'
  | 'Insurance'
  | 'Subscription'
  | 'Other';

export type BillRecurrence = 'OneTime' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface Bill {
  id: string;
  category: BillCategory;
  name: string;
  amount: number;
  dueDate: string;
  recurrence: BillRecurrence;
  reminderLeadDays: number;
  isPaid: boolean;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SaveBillRequest {
  category: BillCategory;
  name: string;
  amount: number;
  dueDate: string;
  recurrence: BillRecurrence;
  reminderLeadDays: number;
  notes?: string | null;
}

export interface SetBillPaidRequest {
  isPaid: boolean;
}

// ---------- Marketplace quotations ----------

export type QuotationRequestStatus = 'Open' | 'Closed' | 'Cancelled';

export type QuoteStatus = 'Submitted' | 'Accepted' | 'Rejected' | 'Withdrawn';

export type QuotationRequestTargetStatus = 'Sent' | 'Viewed' | 'Quoted' | 'Declined';

export interface QuotationItemLine {
  itemKey: string;
  name: string;
  qty: number;
  pack: string;
  /** Customer's optional brand preference for this item (e.g. "Sunflower", "Amul") — shown to the shop as-is. */
  brand?: string | null;
}

export interface QuoteItemLine {
  itemKey: string;
  name: string;
  qty: number;
  pack: string;
  unitPrice: number;
}

export interface SubmitQuotationRequest {
  items: QuotationItemLine[];
  notes?: string | null;
  shopUserIds: string[];
  quotesCloseAt?: string | null;
}

export interface QuotationRequest {
  id: string;
  status: QuotationRequestStatus;
  items: QuotationItemLine[];
  notes: string | null;
  acceptedQuoteId: string | null;
  createdAt: string;
  quoteCount: number;
  lowestQuoteAmount: number | null;
  quotesCloseAt: string | null;
}

export type FulfillmentStatus = 'Accepted' | 'Packing' | 'OutForDelivery' | 'Delivered';

export interface Quote {
  id: string;
  quotationRequestId: string;
  shopUserId: string;
  shopName: string;
  status: QuoteStatus;
  items: QuoteItemLine[];
  totalAmount: number;
  deliveryChargeAmount: number;
  estimatedDeliveryMinutes: number | null;
  validUntil: string | null;
  note: string | null;
  createdAt: string;
  fulfillmentStatus: FulfillmentStatus | null;
  packedItemKeys: string[];
  /** Set for the customer's view of any quote. */
  shopPhone: string | null;
  /** Set only for the shop's own view of a quote it has won (privacy: shared only after acceptance). */
  customerName: string | null;
  customerPhone: string | null;
}

export interface TogglePackedItemRequest {
  itemKey: string;
}

export interface AdvanceFulfillmentRequest {
  status: FulfillmentStatus;
}

export interface PendingShop {
  shopUserId: string;
  shopName: string;
  status: QuotationRequestTargetStatus;
}

export interface CategoryQuoteCount {
  categoryKey: string;
  quoteCount: number;
}

export interface QuotationRequestDetail {
  id: string;
  status: QuotationRequestStatus;
  items: QuotationItemLine[];
  notes: string | null;
  acceptedQuoteId: string | null;
  createdAt: string;
  quotes: Quote[];
  comparison: PriceComparison | null;
  pendingShops: PendingShop[];
  quotesCloseAt: string | null;
  categoryQuoteCounts: CategoryQuoteCount[];
}

export interface AcceptQuoteRequest {
  quoteId: string;
}

export interface ShopSummary {
  userId: string;
  shopName: string;
  city: string | null;
  servedCategoryKeys: string[];
  latitude: number | null;
  longitude: number | null;
  imageUrl: string | null;
}

export interface SubmitQuoteItemLine {
  itemKey: string;
  unitPrice: number;
}

export interface SubmitQuoteRequest {
  items: SubmitQuoteItemLine[];
  note?: string | null;
  deliveryChargeAmount: number;
  estimatedDeliveryMinutes?: number | null;
  validUntil?: string | null;
}

export interface ShopPriceListItem {
  itemKey: string;
  unitPrice: number;
}

export interface SavePriceListRequest {
  items: ShopPriceListItem[];
}

export interface PriceListEntry {
  itemKey: string;
  unitPrice: number;
  previousUnitPrice: number | null;
  updatedAt: string;
}

export interface IncomingQuotationRequest {
  id: string;
  items: QuotationItemLine[];
  notes: string | null;
  createdAt: string;
  targetStatus: QuotationRequestTargetStatus;
  hasQuoted: boolean;
  /** Items in this request outside your shop's declared categories — not shown to you. */
  otherItemsCount: number;
  quotesCloseAt: string | null;
  /** Other shops also competing for these categories — count only, no names or prices (blind bidding). */
  competingShopCount: number;
}

export interface ItemPriceRow {
  itemKey: string;
  name: string;
  /** shopUserId -> unit price, or null/absent if that shop didn't quote this item. */
  priceByShop: Record<string, number | null>;
  cheapestShopUserId: string | null;
}

/** Only present once 2+ shops have quoted on the same request. */
export interface PriceComparison {
  rows: ItemPriceRow[];
  cheapestTotalShopUserId: string;
  cheapestTotalAmount: number;
}

// ---------- Health & Medicines ----------

export interface HouseholdMember {
  id: string;
  name: string;
  relation: string;
  avatarEmoji: string;
}

export interface SaveHouseholdMemberRequest {
  name: string;
  relation: string;
  avatarEmoji: string;
}

export type MedicineMode = 'Daily' | 'Course';

export type FoodTiming = 'AnyTime' | 'BeforeFood' | 'AfterFood';

export interface Medicine {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatarEmoji: string;
  name: string;
  purpose: string | null;
  mode: MedicineMode;
  courseDays: number | null;
  morningQty: number;
  afternoonQty: number;
  eveningQty: number;
  nightQty: number;
  foodTiming: FoodTiming;
  stockCount: number;
  startDate: string;
  nextVisitDate: string | null;
  isActive: boolean;
  perDayQty: number;
  daysRemaining: number;
  lastDoseDate: string | null;
  refillReminderDate: string | null;
  createdAt: string;
}

export interface SaveMedicineRequest {
  memberId: string;
  name: string;
  mode: MedicineMode;
  courseDays?: number | null;
  morningQty: number;
  afternoonQty: number;
  eveningQty: number;
  nightQty: number;
  foodTiming: FoodTiming;
  stockCount: number;
  startDate: string;
  purpose?: string | null;
  nextVisitDate?: string | null;
}

export type DoseSlot = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export type DoseStatus = 'Taken' | 'Skipped';

export interface DoseEntry {
  medicineId: string;
  medicineName: string;
  memberId: string;
  memberName: string;
  memberAvatarEmoji: string;
  slot: DoseSlot;
  qty: number;
  foodTiming: FoodTiming;
  /** `null` means still pending (not yet taken or skipped). */
  status: DoseStatus | null;
  stockLeft: number;
  daysRemaining: number;
}

export interface SetDoseStatusRequest {
  status: DoseStatus | null;
}

export interface PrescriptionDto {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatarEmoji: string;
  doctorName: string;
  doctorSpecialty: string | null;
  visitDate: string;
  revisitDate: string | null;
  medicines: Medicine[];
  createdAt: string;
}

export interface SavePrescriptionRequest {
  memberId: string;
  doctorName: string;
  doctorSpecialty?: string | null;
  visitDate: string;
  revisitDate?: string | null;
  medicines: SaveMedicineRequest[];
}

// ---------- Provider portal (milkman/dhobi accounts linked to household contacts) ----------

export interface ProviderLink {
  id: string;
  serviceContactId: string;
  contactName: string;
  category: ServiceContactCategory;
  inviteCode: string;
  isClaimed: boolean;
  providerDisplayName: string | null;
  createdAt: string;
  claimedAt: string | null;
}

export interface CreateProviderInviteRequest {
  serviceContactId: string;
}

export interface ClaimProviderInviteRequest {
  inviteCode: string;
}

export interface ProviderCustomer {
  householdUserId: string;
  householdName: string;
  city: string | null;
  phone: string | null;
  linkedAt: string;
}

export interface ProviderLaundryTodayItem {
  householdUserId: string;
  householdName: string;
  batchId: string;
  itemsSummary: string;
  itemCount: number;
  amount: number | null;
  isPaid: boolean;
}

export interface ProviderLaundryDashboard {
  customersToday: number;
  itemsGivenToday: number;
  expectedToday: number;
  gaveToday: ProviderLaundryTodayItem[];
  receivedThisMonth: number;
  pendingThisMonth: number;
  customers: ProviderCustomer[];
}

export interface ProviderLaundryCustomerDetail {
  householdUserId: string;
  householdName: string;
  city: string | null;
  active: LaundryBatch[];
  history: LaundryBatch[];
}

export interface ProviderMilkTodayItem {
  householdUserId: string;
  householdName: string;
  quantityLtr: number;
  amount: number;
  status: MilkCalendarStatus;
}

export interface ProviderMilkDashboard {
  activeCustomers: number;
  deliveredCustomers: number;
  pausedCustomers: number;
  missedCustomers: number;
  increasedQuantityCustomers: number;
  decreasedQuantityCustomers: number;
  plannedLitresToday: number;
  totalLitresToday: number;
  expectedToday: number;
  deliverToday: ProviderMilkTodayItem[];
  totalLitresThisMonth: number;
  deliveredDaysThisMonth: number;
  pausedDaysThisMonth: number;
  missedDaysThisMonth: number;
  expectedThisMonth: number;
  receivedThisMonth: number;
  pendingThisMonth: number;
  customers: ProviderCustomer[];
}

export interface ProviderMilkCustomerDetail {
  householdUserId: string;
  householdName: string;
  city: string | null;
  subscription: MilkSubscription | null;
}

// ---------- Manual (off-app) customers ----------

export interface ProviderManualCustomer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  defaultQuantityLtr: number | null;
  defaultRatePerLtr: number | null;
  defaultSlot: MilkSlot;
  defaultVariety: string | null;
  linkCode: string | null;
  isClaimed: boolean;
  claimedByName: string | null;
  createdAt: string;
}

export interface SaveProviderManualCustomerRequest {
  name: string;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  defaultQuantityLtr?: number | null;
  defaultRatePerLtr?: number | null;
  defaultSlot?: MilkSlot;
  defaultVariety?: string | null;
}

export interface ClaimProviderCustomerRequest {
  linkCode: string;
}

export type ManualMilkEntryKind = 'Regular' | 'Extra' | 'Return';

export interface ManualMilkEntry {
  id: string;
  date: string;
  slot: MilkSlot;
  variety: string | null;
  quantityLtr: number;
  ratePerLtr: number;
  amount: number;
  kind: ManualMilkEntryKind;
  note: string | null;
  isPaid: boolean;
}

export interface SaveManualMilkEntryRequest {
  date: string;
  slot: MilkSlot;
  variety?: string | null;
  quantityLtr: number;
  ratePerLtr: number;
  isPaid?: boolean;
}

export interface AddManualMilkExtraRequest {
  date: string;
  slot: MilkSlot;
  variety?: string | null;
  quantityLtr: number;
  ratePerLtr: number;
  note?: string | null;
}

export interface AddManualMilkReturnRequest {
  date: string;
  slot: MilkSlot;
  variety?: string | null;
  quantityLtr: number;
  ratePerLtr: number;
  note?: string | null;
}

export interface SetManualMilkPaidRequest {
  isPaid: boolean;
}

export interface ManualMilkDaySummary {
  date: string;
  customerCount: number;
  plannedLitres: number;
  loggedLitres: number;
  amount: number;
}

export interface ManualMilkDayCustomer {
  providerCustomerId: string;
  customerName: string;
  plannedQuantityLtr: number;
  loggedEntry: ManualMilkEntry | null;
}

export interface ManualLaundryBatch {
  id: string;
  serviceType: LaundryServiceType;
  givenOn: string;
  expectedReturn: string | null;
  status: LaundryBatchStatus;
  pickedUpOn: string | null;
  amount: number | null;
  isPaid: boolean;
  items: LaundryItemLine[];
  notes: string | null;
  createdAt: string;
}

export interface SaveManualLaundryBatchRequest {
  serviceType: LaundryServiceType;
  givenOn: string;
  expectedReturn?: string | null;
  items: LaundryItemLine[];
  notes?: string | null;
}

export interface MarkManualPickedUpRequest {
  amount?: number | null;
  items?: LaundryItemLine[] | null;
}

export interface SetManualLaundryPaidRequest {
  isPaid: boolean;
}

// ---------- Laundry pickup requests ----------

export interface LaundryPickupRequest {
  id: string;
  householdUserId: string;
  householdName: string;
  requestedDate: string;
  note: string | null;
  createdAt: string;
  isHandled: boolean;
}

export interface CreatePickupRequestRequest {
  serviceContactId: string;
  requestedDate: string;
  note?: string | null;
}
