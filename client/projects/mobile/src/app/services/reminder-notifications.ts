import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BRAND, Reminder } from '@gurtundaa/shared';

/**
 * Mirrors the reminder list into on-device notifications, so the phone buzzes even when the app
 * is closed. Native only: in the browser (ionic serve) this is a no-op.
 */
@Injectable({ providedIn: 'root' })
export class ReminderNotifications {
  private readonly enabled = Capacitor.isNativePlatform();
  private permissionAsked = false;

  async sync(reminders: Reminder[]): Promise<void> {
    if (!this.enabled || !(await this.ensurePermission())) {
      return;
    }

    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    }

    const now = Date.now();
    const upcoming = reminders.filter((r) => !r.isDone && r.dueAt && new Date(r.dueAt).getTime() > now);
    if (upcoming.length === 0) {
      return;
    }

    await LocalNotifications.schedule({
      notifications: upcoming.map((r) => ({
        id: toNotificationId(r.id),
        title: `${BRAND.emoji} gurtundaa? ${r.title}`,
        body: r.notes || (r.priority === 'Urgent' ? 'this one is urgent fr 🔥' : 'just a lil nudge 🫶'),
        schedule: { at: new Date(r.dueAt!), allowWhileIdle: true },
        extra: { reminderId: r.id },
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

/** Notification ids must be 32-bit ints; derive a stable one from the reminder's GUID. */
function toNotificationId(guid: string): number {
  let hash = 0;
  for (let i = 0; i < guid.length; i++) {
    hash = (Math.imul(31, hash) + guid.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2_000_000_000;
}
