import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { LaundryBatch, parseDateOnly } from '@gurtundaa/shared';

/**
 * Mirrors active laundry batches' expected-return dates — and any individual item's earlier
 * `neededBy` deadline (e.g. a school uniform needed before the rest of the batch) — into on-device
 * notifications, scheduled for 9am on the relevant day, so the phone buzzes even when the app is
 * closed. Native only: in the browser this is a no-op. Same pattern as `BillNotifications`.
 */
@Injectable({ providedIn: 'root' })
export class LaundryNotifications {
  private readonly enabled = Capacitor.isNativePlatform();
  private permissionAsked = false;

  async sync(activeBatches: LaundryBatch[]): Promise<void> {
    if (!this.enabled || !(await this.ensurePermission())) {
      return;
    }

    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter((n) => n.id >= LAUNDRY_ID_OFFSET);
    if (ours.length > 0) {
      await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
    }

    const now = Date.now();
    const remindAt9am = (dateOnly: string) => {
      const d = parseDateOnly(dateOnly);
      d.setHours(9, 0, 0, 0);
      return d;
    };

    const batchReminders = activeBatches
      .filter((b): b is LaundryBatch & { expectedReturn: string } => !!b.expectedReturn)
      .flatMap((b) => {
        const remindAt = remindAt9am(b.expectedReturn);
        if (remindAt.getTime() <= now) return [];
        const itemCount = b.items.reduce((sum, i) => sum + i.quantity, 0);
        return [
          {
            id: toNotificationId(b.id),
            title: '🧺 Laundry pickup today',
            body: `${itemCount} item${itemCount === 1 ? '' : 's'} at ${b.contactName ?? 'the dhobi'} — don't forget to pick up!`,
            schedule: { at: remindAt, allowWhileIdle: true },
            extra: { batchId: b.id },
          },
        ];
      });

    const itemReminders = activeBatches.flatMap((b) =>
      b.items
        .filter((i): i is typeof i & { neededBy: string } => !!i.neededBy)
        .flatMap((i) => {
          const remindAt = remindAt9am(i.neededBy);
          if (remindAt.getTime() <= now) return [];
          return [
            {
              id: toNotificationId(`${b.id}:${i.itemType}`),
              title: `🧺 ${i.itemType} needed today`,
              body: `${i.quantity} ${i.itemType.toLowerCase()} at ${b.contactName ?? 'the dhobi'} — needed sooner than the rest of this batch.`,
              schedule: { at: remindAt, allowWhileIdle: true },
              extra: { batchId: b.id, itemType: i.itemType },
            },
          ];
        }),
    );

    const notifications = [...batchReminders, ...itemReminders];
    if (notifications.length === 0) {
      return;
    }

    await LocalNotifications.schedule({ notifications });
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

// Reminders/Bills use their own disjoint offset ranges; this one must not overlap either so
// cancelling "our" notifications never touches another module's schedule.
const LAUNDRY_ID_OFFSET = 1_500_000_000;

function toNotificationId(guid: string): number {
  let hash = 0;
  for (let i = 0; i < guid.length; i++) {
    hash = (Math.imul(31, hash) + guid.charCodeAt(i)) | 0;
  }
  return LAUNDRY_ID_OFFSET + (Math.abs(hash) % 500_000_000);
}
