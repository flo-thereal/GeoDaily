const REMINDER_TAG = 'geodaily-daily-reminder';

let reminderTimeoutId: ReturnType<typeof window.setTimeout> | undefined;

function clearScheduledReminder(): void {
  if (reminderTimeoutId !== undefined) {
    window.clearTimeout(reminderTimeoutId);
    reminderTimeoutId = undefined;
  }
}

export async function syncDailyReminder(enabled: boolean, time: string): Promise<void> {
  clearScheduledReminder();

  if (!enabled || !('Notification' in window)) return;

  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  if (Notification.permission !== 'granted') return;

  scheduleClientReminder(time);
}

function scheduleClientReminder(time: string): void {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  const delay = next.getTime() - now.getTime();

  reminderTimeoutId = globalThis.setTimeout(() => {
    reminderTimeoutId = undefined;
    if (Notification.permission === 'granted') {
      new Notification('GeoDaily', {
        body: 'Your daily geography challenge is ready. 5 minutes to expand your world!',
        tag: REMINDER_TAG,
        icon: `${import.meta.env.BASE_URL}icons/icon.svg`,
      });
    }
    scheduleClientReminder(time);
  }, delay);
}
