import type { Course, CourseSession } from "@/types/content";

// A course registration only stores the session it was made for as free text
// (session_label), so working out whether it has passed means mapping that
// label back onto the course's session dates. The label format below mirrors
// apps/frontend/lib/course-registration.ts — if the two ever drift apart the
// match simply fails and the course-level date is used instead.

export function getCourseSessions(
  course: Pick<Course, "sessions" | "start_date" | "end_date">,
): CourseSession[] {
  if (course.sessions && course.sessions.length > 0) return course.sessions;
  if (course.start_date) {
    return [{ start: course.start_date, end: course.end_date, start_time: null, end_time: null }];
  }
  return [];
}

function formatDateNb(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("nb-NO", options);
}

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

export function formatSessionLabel(session: CourseSession): string {
  const datePart = formatCourseDateRange(session.start, session.end);
  const timePart = formatTimeRange(session.start_time ?? null, session.end_time ?? null);
  return timePart ? `${datePart}, ${timePart}` : datePart;
}

function sessionEndDate(session: CourseSession): string {
  return session.end ?? session.start;
}

// The last date the course is running, used when a registration's session
// cannot be identified.
function lastCourseDate(course: Pick<Course, "sessions" | "start_date" | "end_date">): string | null {
  const dates = getCourseSessions(course).map(sessionEndDate).filter(Boolean);
  if (dates.length === 0) return course.end_date ?? course.start_date ?? null;
  return dates.slice().sort().at(-1) ?? null;
}

// The date a registration should be judged by: the end of the session it was
// made for, or the end of the whole course when the session is unknown.
// Returns null when the course has no dates at all, in which case callers
// should treat the registration as still upcoming rather than hide it.
export function resolveRegistrationDate(
  sessionLabel: string | null,
  course: Pick<Course, "sessions" | "start_date" | "end_date"> | undefined,
): string | null {
  if (!course) return null;

  if (sessionLabel) {
    const match = getCourseSessions(course).find((session) => formatSessionLabel(session) === sessionLabel);
    if (match) return sessionEndDate(match);
  }

  return lastCourseDate(course);
}
