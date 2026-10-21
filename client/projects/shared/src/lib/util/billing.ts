import { rupeeLabel } from './vibes';

// Shared "bill" shape for anything with itemized qty/rate/amount lines — used today to format
// WhatsApp messages (Milk settlement, Laundry bills/item-lists), and designed to be reused as-is
// by a future print/receipt renderer so that feature doesn't need its own data model.

export interface BillLineItem {
  label: string;
  qty: string;
  rate?: string;
  amount?: string;
}

export interface BillTotal {
  label: string;
  amount: string;
  isPaid: boolean;
  /** Classic Indian invoice convention, e.g. "Three Thousand Four Hundred Seventy Seven Rupees Only" — pass via `rupeesInWords()`. */
  amountInWords?: string;
}

export interface BillQuantitySummary {
  label: string;
  value: string;
}

export interface BillData {
  icon: string;
  title: string;
  subtitleLines?: string[];
  items: BillLineItem[];
  /** e.g. "Total Liters" / "40.0 Ltr", or "Total Items" / "14" — shown even when there's no price yet. */
  quantitySummary?: BillQuantitySummary;
  total?: BillTotal;
  closingLine?: string;
  /** Reserved for the future print/receipt renderer — the WhatsApp text formatter ignores this. */
  includeSignatureLine?: boolean;
}

/**
 * Renders a `BillData` as WhatsApp message text. Uses a numbered list rather than a
 * space-aligned/```monospace``` table — WhatsApp Web doesn't reliably apply monospace formatting
 * (confirmed: columns render in a proportional font there, so padding-based alignment just looks
 * broken), while a numbered list stays readable in any font and doubles as the line's S.No.
 */
// Matches the dashed section rules on a printed/thermal receipt — WhatsApp renders this as plain
// text (no table support), but the dashes alone read as a clear section break in any font.
const DIVIDER = '-'.repeat(32);

export function formatWhatsAppBill(bill: BillData): string {
  const lines: string[] = [`${bill.icon} *${bill.title}*`];
  for (const sub of bill.subtitleLines ?? []) {
    lines.push(sub);
  }

  if (bill.items.length > 0) {
    lines.push(DIVIDER);
    bill.items.forEach((item, index) => {
      const parts = [`${index + 1}. ${item.label} — ${item.qty}`];
      if (item.rate && item.amount) {
        parts.push(`× ${item.rate} = ${item.amount}`);
      }
      lines.push(parts.join(' '));
    });
  }

  if (bill.quantitySummary || bill.total) {
    lines.push(DIVIDER);
  }
  if (bill.quantitySummary) {
    lines.push(`${bill.quantitySummary.label}: ${bill.quantitySummary.value}`);
  }
  if (bill.total) {
    lines.push(`*${bill.total.label}: ${bill.total.amount}*`);
    if (bill.total.amountInWords) {
      lines.push(`Amount in Words: ${bill.total.amountInWords}`);
    }
    lines.push(`Status: *${bill.total.isPaid ? 'Paid' : 'Pending'}*`);
  }

  if (bill.closingLine) {
    lines.push(DIVIDER);
    lines.push(bill.closingLine);
  }

  return lines.join('\n');
}

export interface QuotationRequestWhatsAppInput {
  customerName: string;
  city?: string | null;
  items: { name: string; qty: number; pack: string }[];
  notes?: string | null;
}

/**
 * Formats a quotation request for a shop contact who doesn't have the app yet — no prices shown
 * (the catalog itself never shows prices), just what's needed plus a prompt to reply with a quote.
 */
export function formatWhatsAppQuotationRequest(req: QuotationRequestWhatsAppInput): string {
  return formatWhatsAppBill({
    icon: '🛒',
    title: `Quotation Request from ${req.customerName}`,
    subtitleLines: req.city ? [`📍 ${req.city}`] : undefined,
    items: req.items.map((i) => ({ label: i.name, qty: i.qty > 1 ? `${i.qty} × ${i.pack}` : i.pack })),
    closingLine: req.notes
      ? `Note: ${req.notes}\n\nPlease reply with your best price for each item 🙏`
      : 'Please reply with your best price for each item 🙏',
  });
}

export interface QuoteWhatsAppInput {
  shopName: string;
  items: { name: string; qty: number; pack: string; unitPrice: number }[];
  deliveryChargeAmount: number;
  estimatedDeliveryMinutes?: number | null;
  validUntil?: string | null;
  note?: string | null;
}

/** Formats a shop's own submitted quote as a shareable reference price list — e.g. to forward to a customer on WhatsApp outside the app, or keep as a record. */
export function formatWhatsAppQuote(q: QuoteWhatsAppInput): string {
  const itemsTotal = q.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  const grandTotal = itemsTotal + q.deliveryChargeAmount;

  const closingLines = [
    q.deliveryChargeAmount > 0 ? `Delivery: ${rupeeLabel(q.deliveryChargeAmount)}` : 'Delivery: Free',
    `*Total: ${rupeeLabel(grandTotal)}*`,
  ];
  if (q.estimatedDeliveryMinutes) closingLines.push(`Can deliver in ${q.estimatedDeliveryMinutes} min`);
  if (q.validUntil) closingLines.push(`Valid until ${new Date(q.validUntil).toLocaleString()}`);
  if (q.note) closingLines.push(`Note: ${q.note}`);

  return formatWhatsAppBill({
    icon: '💰',
    title: `Quote from ${q.shopName}`,
    items: q.items.map((i) => ({
      label: i.name,
      qty: i.qty > 1 ? `${i.qty} × ${i.pack}` : i.pack,
      rate: rupeeLabel(i.unitPrice),
      amount: rupeeLabel(i.qty * i.unitPrice),
    })),
    closingLine: closingLines.join('\n'),
  });
}
