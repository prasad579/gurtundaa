import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { NextVisitAlert, parseDateOnly } from '@gurtundaa/shared';

/**
 * Mirrors due-or-overdue next-visit alerts (doctor checkups and per-medicine reminders) into
 * on-device notifications, scheduled for 9am on the due date, so the phone buzzes even when the
 * app is closed. Native only: in the browser this is a no-op. Same pattern as `BillNotifications`.
 */
@Injectable({ providedIn: 'root' })
export class HealthVisitNotifications {
  private readonly enabled = Capacitor.isNativePlatform();
  private permissionAsked = false;

  async sync(alerts: NextVisitAlert[]): Promise<void> {
    if (!this.enabled || !(await this.ensurePermission())) {
      return;
    }

    const pending = await LocalNotifications.getPending();
    const ours = pending.notifications.filter((n) => n.id >= HEALTH_VISIT_ID_OFFSET);
    if (ours.length > 0) {
      await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
    }

    const now = Date.now();
    const upcoming = alerts.flatMap((alert) => {
      const remindAt = parseDateOnly(alert.date);
      remindAt.setHours(9, 0, 0, 0);
      return remindAt.getTime() > now ? [{ alert, remindAt }] : [];
    });
    if (upcoming.length === 0) {
      return;
    }

    await LocalNotifications.schedule({
      notifications: upcoming.map(({ alert, remindAt }) => ({
        id: toNotificationId(alert.key),
        title: '🗓️ Upcoming visit',
        body: `${alert.title} — ${alert.memberName}`,
        schedule: { at: remindAt, allowWhileIdle: true },
        extra: { key: alert.key },
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

// Reminders/Bills/Laundry use their own disjoint offset ranges (0-2.0B, 1.0B-1.5B, 1.5B-2.0B); this
// one must not overlap any of them so cancelling "our" notifications never touches another module's.
const HEALTH_VISIT_ID_OFFSET = 2_000_000_000;

function toNotificationId(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (Math.imul(31, hash) + key.charCodeAt(i)) | 0;
  }
  return HEALTH_VISIT_ID_OFFSET + (Math.abs(hash) % 140_000_000);
}
