/* ============================================================
   Shared day/time-of-day grouping helpers for the Schedule and
   Side Schedule panels. Both group items chronologically by day
   (collapsible, today expanded by default) and color-code each
   item by time-of-day bucket, graying it out once it's over.
   ============================================================ */

/** Local calendar-day key, e.g. "2026-07-19", for grouping by day. */
export function dayKeyOf(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "Today" / "Tomorrow" / full weekday+date heading for a day group. */
export function formatDayHeading(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((day.getTime() - today.getTime()) / 86400000);

  const dateStr = day.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  if (diffDays === 0) return `Today — ${dateStr}`;
  if (diffDays === 1) return `Tomorrow — ${dateStr}`;
  if (diffDays === -1) return `Yesterday — ${dateStr}`;
  return dateStr;
}

export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night';

/** morning <12pm, afternoon 12-5pm, evening 5-9pm, night 9pm-6am. */
export function timeBucketOf(iso: string): TimeBucket {
  const hour = new Date(iso).getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

const BUCKET_LABEL: Record<TimeBucket, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
};

export function bucketLabel(bucket: TimeBucket): string {
  return BUCKET_LABEL[bucket];
}

/** CSS var for the bucket's accent color (used as a left-border stripe). */
const BUCKET_COLOR_VAR: Record<TimeBucket, string> = {
  morning: 'var(--warning)',
  afternoon: 'var(--accent)',
  evening: 'var(--danger)',
  night: 'var(--purple)',
};

export function bucketColorVar(bucket: TimeBucket): string {
  return BUCKET_COLOR_VAR[bucket];
}

/** An item is "past" once its end time (or start time, if no end) has elapsed. */
export function isItemPast(item: { startTime: string; endTime?: string | null }): boolean {
  const reference = item.endTime || item.startTime;
  return new Date(reference).getTime() < Date.now();
}

/** Groups already-sorted (by startTime asc) items into ordered day buckets. */
export function groupByDay<T extends { startTime: string }>(items: T[]): Array<{ dayKey: string; items: T[] }> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = dayKeyOf(item.startTime);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dayKey, dayItems]) => ({ dayKey, items: dayItems }));
}
