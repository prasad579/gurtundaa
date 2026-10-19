import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Bill, BILL_CATEGORY_LABELS, rupeeLabel } from '@gurtundaa/shared';

/**
 * Mirrors unpaid bills into on-device notifications, scheduled for each bill's own reminder lead
 * time, so the phone buzzes even when the app is closed. Native only: in the browser this is a
 * no-op. Same pattern as `ReminderNotifications`.
 */
@Injectable({ providedIn: 'root' })
export class BillNotifications {
  private readonly enabled = Capacitor.isNativePlatform();
  private permissionAsked = false;

  async sync(bills: Bill[]): Promise<void> {
    if (!this.enabled || !(await this.ensurePermission())) {
      return;
    }

    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter((n) => n.id >= BILL_ID_OFFSET);
    if (ours.length > 0) {
      await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
    }

    const now = Date.now();
    const upcoming = bills.filter((b) => !b.isPaid).flatMap((b) => {
      const remindAt = new Date(b.dueDate);
      remindAt.setDate(remindAt.getDate() - b.reminderLeadDays);
      return remindAt.getTime() > now ? [{ bill: b, remindAt }] : [];
    });
    if (upcoming.length === 0) {
      return;
    }

    await LocalNotifications.schedule({
      notifications: upcoming.map(({ bill, remindAt }) => ({
        id: toNotificationId(bill.id),
        title: `🧾 ${bill.name} due soon`,
        body: `${BILL_CATEGORY_LABELS[bill.category].label} — ${rupeeLabel(bill.amount)} due ${formatShort(bill.dueDate)}`,
        schedule: { at: remindAt, allowWhileIdle: true },
        extra: { billId: bill.id },
      })),
    });
  }

  private async ensurePermission(): Promise<boolean> {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted') {
      return true;
    }
    if (this.permissionAsked) {
      return false;
    }
    this.permissionAsked = true;
    return (await LocalNotifications.requestPermissions()).display === 'granted';
  }
}

function formatShort(dateOnly: string): string {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// Reminders use ids derived straight from their guid hash; offset bill ids into a disjoint range
// so cancelling "our" notifications never touches the Reminders module's own schedule.
const BILL_ID_OFFSET = 1_000_000_000;

function toNotificationId(guid: string): number {
  let hash = 0;
  for (let i = 0; i < guid.length; i++) {
    hash = (Math.imul(31, hash) + guid.charCodeAt(i)) | 0;
  }
  return BILL_ID_OFFSET + (Math.abs(hash) % 500_000_000);
}
