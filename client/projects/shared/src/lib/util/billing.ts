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
export function formatWhatsAppBill(bill: BillData): string {
  const lines: string[] = [`${bill.icon} *${bill.title}*`];
  for (const sub of bill.subtitleLines ?? []) {
    lines.push(sub);
  }

  if (bill.items.length > 0) {
    lines.push('');
    bill.items.forEach((item, index) => {
      const parts = [`${index + 1}. ${item.label} — ${item.qty}`];
      if (item.rate && item.amount) {
        parts.push(`× ${item.rate} = ${item.amount}`);
      }
      lines.push(parts.join(' '));
    });
  }

  if (bill.quantitySummary || bill.total) {
    lines.push('');
  }
  if (bill.quantitySummary) {
    lines.push(`${bill.quantitySummary.label}: ${bill.quantitySummary.value}`);
  }
  if (bill.total) {
    lines.push(`*${bill.total.label}: ${bill.total.amount}*`);
    lines.push(`Status: *${bill.total.isPaid ? 'Paid' : 'Pending'}*`);
  }

  if (bill.closingLine) {
    lines.push('');
    lines.push(bill.closingLine);
  }

  return lines.join('\n');
}
