import type { Course, CourseSession } from "@/lib/content";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[\d\s+()-]{8,16}$/;

export function getCourseSessions(course: Pick<Course, "sessions" | "start_date" | "end_date">): CourseSession[] {
  if (course.sessions && course.sessions.length > 0) return course.sessions;
  if (course.start_date) return [{ start: course.start_date, end: course.end_date, start_time: null, end_time: null }];
  return [];
}

function formatDateNb(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("nb-NO", options);
}

// Matches the original app: "17.–18. okt. 2026" / "17. okt. 2026 – 14. nov. 2026"
function formatCourseDateRange(startDate: string, endDate: string | null): string {
  if (!endDate || endDate === startDate) {
    return formatDateNb(startDate, { day: "numeric", month: "short", year: "numeric" });
  }

  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

  if (startYear === endYear && startMonth === endMonth) {
    const monthYear = formatDateNb(startDate, { month: "short", year: "numeric" });
    return `${startDay}\u2013${endDay}. ${monthYear}`;
  }

  const start = formatDateNb(startDate, { day: "numeric", month: "short", year: "numeric" });
  const end = formatDateNb(endDate, { day: "numeric", month: "short", year: "numeric" });
  return `${start} \u2013 ${end}`;
}

function formatTimeRange(startTime: string | null, endTime: string | null): string | null {
  if (startTime && endTime) return `${startTime}\u2013${endTime}`;
  if (startTime) return `kl. ${startTime}`;
  return null;
}

// Matches the original app: "17.–18. okt. 2026, 09:00–16:00"
export function formatSessionLabel(session: CourseSession): string {
  const datePart = formatCourseDateRange(session.start, session.end);
  const timePart = formatTimeRange(session.start_time ?? null, session.end_time ?? null);
  return timePart ? `${datePart}, ${timePart}` : datePart;
}

export const DEFAULT_SESSION_CAPACITY = 12;

export function getSessionCapacity(session: CourseSession): number {
  if (typeof session.capacity === "number" && session.capacity > 0) {
    return session.capacity;
  }
  return DEFAULT_SESSION_CAPACITY;
}

export interface CourseSessionAvailability {
  label: string;
  capacity: number;
  spotsLeft: number;
  isFull: boolean;
}

// counts: active (non-cancelled) registrations per session label.
export function buildCourseSessionAvailability(
  course: Pick<Course, "sessions" | "start_date" | "end_date">,
  counts: Readonly<Record<string, number>>,
): CourseSessionAvailability[] {
  return getCourseSessions(course).map((session) => {
    const label = formatSessionLabel(session);
    const capacity = getSessionCapacity(session);
    const occupied = counts[label] ?? 0;
    const spotsLeft = Math.max(capacity - occupied, 0);
    return { label, capacity, spotsLeft, isFull: spotsLeft <= 0 };
  });
}

export function getCourseSessionLabels(course: Pick<Course, "sessions" | "start_date" | "end_date">): string[] {
  return getCourseSessions(course).map(formatSessionLabel);
}

export interface CourseRegistrationPayload {
  courseSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sessionLabel?: string;
  message?: string;
}

export function validateCourseRegistrationPayload(
  data: unknown,
): { ok: true; value: CourseRegistrationPayload } | { ok: false; error: string } {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Ugyldig forespørsel." };
  }

  const payload = data as Record<string, unknown>;

  // Honeypot field: bots fill it, humans never see it.
  if (typeof payload.website === "string" && payload.website.trim().length > 0) {
    return { ok: false, error: "Forespørselen ble avvist." };
  }

  const courseSlug = typeof payload.courseSlug === "string" ? payload.courseSlug.trim() : "";
  const firstName = typeof payload.firstName === "string" ? payload.firstName.trim() : "";
  const lastName = typeof payload.lastName === "string" ? payload.lastName.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  const sessionLabel = typeof payload.sessionLabel === "string" ? payload.sessionLabel.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (!courseSlug) return { ok: false, error: "Ugyldig kurs." };

  if (firstName.length < 2 || firstName.length > 80) {
    return { ok: false, error: "Oppgi et gyldig fornavn." };
  }

  if (lastName.length < 2 || lastName.length > 80) {
    return { ok: false, error: "Oppgi et gyldig etternavn." };
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Oppgi en gyldig e-postadresse." };
  }

  if (!PHONE_PATTERN.test(phone)) {
    return { ok: false, error: "Oppgi et gyldig telefonnummer." };
  }

  if (sessionLabel.length > 200) {
    return { ok: false, error: "Ugyldig kursdato." };
  }

  if (message.length > 1000) {
    return { ok: false, error: "Meldingen er for lang." };
  }

  return {
    ok: true,
    value: {
      courseSlug,
      firstName,
      lastName,
      email,
      phone,
      sessionLabel: sessionLabel || undefined,
      message: message || undefined,
    },
  };
}
