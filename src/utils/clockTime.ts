// src/utils/clockTime.ts
// Time-of-day display. Postgres `time` columns come back as "HH:MM:SS" (e.g. developer office
// hours in opening_days); people read "8:00 AM".

// "08:00:00" / "08:00" -> "8:00 AM", "17:30:00" -> "5:30 PM". Seconds are dropped.
// Anything that isn't a time is returned as it was.
export function formatClockTime(time: string | null | undefined): string {
  if (!time) return '';
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return time;
  const hours = Number(match[1]);
  if (hours > 23) return time;
  const period = hours >= 12 ? 'PM' : 'AM';
  return `${hours % 12 || 12}:${match[2]} ${period}`;
}
