// Date helpers shared by the availability pages. Kept free of server-only
// imports so both server components and client components can use them.

// Noon avoids the date shifting when the string is parsed in another timezone.
export function parseAvailabilityDate(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatShortDate(value: string): string {
  const date = parseAvailabilityDate(value);
  if (!date) return value;
  return date.toLocaleDateString("nb-NO", { day: "numeric", month: "long" });
}

export function formatAvailabilityDate(value: string): string {
  const date = parseAvailabilityDate(value);
  if (!date) return value;
  const label = date.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Today's date in Norway, so the split between upcoming and past days matches
// what visitors see even though the server runs in UTC.
export function todayInOslo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo" }).format(new Date());
}

export const AVAILABILITY_SCOPES = ["day", "week", "month"] as const;

export type AvailabilityScope = (typeof AVAILABILITY_SCOPES)[number];

export const AVAILABILITY_SCOPE_LABELS: Record<AvailabilityScope, string> = {
  day: "Bare denne dagen",
  week: "Hele uken",
  month: "Hele måneden",
};

export function parseAvailabilityScope(value: unknown): AvailabilityScope {
  return AVAILABILITY_SCOPES.includes(value as AvailabilityScope) ? (value as AvailabilityScope) : "day";
}

// Expands the picked date to every day a save should cover. Dates before
// `notBefore` are dropped so choosing a week or month never opens days that
// have already passed.
export function expandAvailabilityDates(
  isoDate: string,
  scope: AvailabilityScope,
  { skipWeekends = false, notBefore }: { skipWeekends?: boolean; notBefore?: string } = {},
): string[] {
  const picked = parseAvailabilityDate(isoDate);
  if (!picked) return [];
  if (scope === "day") return [isoDate];

  const dates: Date[] = [];

  if (scope === "week") {
    // Monday-based week, matching the calendar in the form.
    const monday = new Date(picked);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    for (let offset = 0; offset < 7; offset++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + offset);
      dates.push(day);
    }
  } else {
    const lastDay = new Date(picked.getFullYear(), picked.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= lastDay; day++) {
      dates.push(new Date(picked.getFullYear(), picked.getMonth(), day, 12));
    }
  }

  return dates
    .filter((date) => !skipWeekends || (date.getDay() !== 0 && date.getDay() !== 6))
    .map(toIsoDate)
    .filter((date) => !notBefore || date >= notBefore);
}
