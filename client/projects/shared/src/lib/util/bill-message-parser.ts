import { BillCategory } from '../api/models';

export interface ParsedBillMessage {
  category: BillCategory;
  name: string | null;
  amount: number | null;
  dueDate: string | null; // yyyy-MM-dd, or null if no date could be confidently extracted
}

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

const CATEGORY_KEYWORDS: [RegExp, BillCategory][] = [
  [/\belectricity\b|\bpower\b|\bdiscom\b/i, 'Electricity'],
  [/\bwater\b/i, 'Water'],
  [/\binternet\b|\bbroadband\b|\bfiber\b|\bwifi\b/i, 'Internet'],
  [/\bmobile\b|\bpostpaid\b|\bprepaid\b|\brecharge\b|\bphone\b/i, 'Phone'],
  [/\bcredit card\b/i, 'CreditCard'],
  [/\brent\b/i, 'Rent'],
  [/\binsurance\b|\bpolicy\b|\bpremium\b/i, 'Insurance'],
  [/\bnetflix\b|\bprime\b|\bhotstar\b|\bsubscription\b|\bspotify\b/i, 'Subscription'],
];

/**
 * Best-effort parse of a forwarded SMS/email bill reminder into prefillable bill fields. Designed
 * to be reviewed and corrected by the user in the Add Bill form, not saved blindly — free text is
 * too varied for this to ever be fully reliable.
 */
export function parseBillMessage(text: string): ParsedBillMessage {
  return {
    category: extractCategory(text),
    name: extractName(text),
    amount: extractAmount(text),
    dueDate: extractDueDate(text),
  };
}

function extractCategory(text: string): BillCategory {
  for (const [pattern, category] of CATEGORY_KEYWORDS) {
    if (pattern.test(text)) return category;
  }
  return 'Other';
}

function extractName(text: string): string | null {
  // "...bill from <Provider> is due..." / "...bill from <Provider>." / "for <Provider>"
  const fromMatch = text.match(/\bfrom\s+([A-Z][A-Za-z0-9 .&'-]{2,80}?)(?:\s+is\s+due|\s+was\s+due|[.\n]|$)/);
  if (fromMatch) return fromMatch[1].trim();

  const forMatch = text.match(/\bfor\s+([A-Z][A-Za-z0-9 .&'-]{2,80}?)(?:\s+is\s+due|\s+was\s+due|[.\n]|$)/);
  if (forMatch) return forMatch[1].trim();

  return null;
}

const AMOUNT_LABEL_PATTERN =
  /(?:due\s*amount|amount\s*due|bill\s*amount|total\s*amount|amount\s*payable)[:\s]*\**\s*(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i;
const ANY_RUPEE_PATTERN = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i;

function extractAmount(text: string): number | null {
  const labeled = text.match(AMOUNT_LABEL_PATTERN);
  const match = labeled ?? text.match(ANY_RUPEE_PATTERN);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(value) ? value : null;
}

const DATE_LABEL_PATTERN = /(?:due\s*date|due\s*on|due\s*by|pay\s*by)[:\s]*\**\s*([^\n*]+)/i;

function extractDueDate(text: string, now = new Date()): string | null {
  if (/\bdue\s+today\b/i.test(text)) {
    return toDateOnlyString(now);
  }
  if (/\bdue\s+tomorrow\b/i.test(text)) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toDateOnlyString(tomorrow);
  }

  const labeled = text.match(DATE_LABEL_PATTERN);
  const candidate = labeled ? labeled[1] : text;

  // "19 Oct 2026" / "19-Oct-2026"
  const longForm = candidate.match(/(\d{1,2})[\s-]+([A-Za-z]{3,9})[\s,-]+(\d{2,4})/);
  if (longForm) {
    const month = MONTHS[longForm[2].slice(0, 3).toLowerCase()];
    if (month !== undefined) {
      const year = normalizeYear(Number(longForm[3]));
      return toDateOnlyString(new Date(year, month, Number(longForm[1])));
    }
  }

  // "19/10/2026" or "19-10-2026" (day/month/year, the common Indian convention).
  const numeric = candidate.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (numeric) {
    const year = normalizeYear(Number(numeric[3]));
    return toDateOnlyString(new Date(year, Number(numeric[2]) - 1, Number(numeric[1])));
  }

  return null;
}

function normalizeYear(year: number): number {
  return year < 100 ? 2000 + year : year;
}

function toDateOnlyString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
