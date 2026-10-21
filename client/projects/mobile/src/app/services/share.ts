import { Share } from '@capacitor/share';

/**
 * Opens the native share sheet so the user can forward to any app/contact, not just a saved
 * contact's WhatsApp number. Native: the OS share sheet. Browser: falls back to `navigator.share`
 * where supported; silently no-ops otherwise (user cancelling is equally silent).
 */
export async function shareText(text: string, title?: string): Promise<void> {
  try {
    await Share.share({ text, title });
  } catch {
    // Cancelled by the user, or unsupported on this platform/browser — both are no-ops.
  }
}
