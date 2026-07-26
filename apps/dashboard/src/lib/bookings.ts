import { todayInOslo } from "@/lib/availability";
import { resolveRegistrationDate } from "@/lib/course-sessions";
import { createClient } from "@/lib/supabase/server";
import type { AvailabilityDay, BookingRequest, CourseRegistration } from "@/types/booking";
import type { Course } from "@/types/content";

export type PendingCounts = {
  bookings: number;
  courseRegistrations: number;
};

type CourseDateRow = Pick<Course, "id" | "slug" | "start_date" | "end_date" | "sessions">;

// A registration plus the course date it is judged by (null when unknown).
export type DatedCourseRegistration = CourseRegistration & { course_date: string | null };

// Pending (unhandled) requests, shown as sidebar badges. Only upcoming ones
// count: a request whose date has passed can no longer be acted on, and it
// lives on the history page rather than the main list, so counting it would
// send you to a page where it isn't shown.
export async function getPendingCounts(): Promise<PendingCounts> {
  const supabase = await createClient();
  const [bookings, registrations] = await Promise.all([
    supabase
      .from("booking_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .gte("date", todayInOslo()),
    getCourseRegistrations(),
  ]);
  return {
    bookings: bookings.count ?? 0,
    courseRegistrations: registrations.filter((row) => row.status === "pending").length,
  };
}

const BOOKING_COLUMNS =
  "id, first_name, last_name, email, phone, service, date, time, message, status, cancel_token, confirm_token, confirmed_at, created_at, cancelled_at";

// Appointments today or later, soonest first.
export async function getBookingRequests(): Promise<BookingRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_requests")
    .select(BOOKING_COLUMNS)
    .gte("date", todayInOslo())
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  return (data as BookingRequest[]) ?? [];
}

// Appointments whose date has passed, most recent first.
export async function getPastBookingRequests(): Promise<BookingRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_requests")
    .select(BOOKING_COLUMNS)
    .lt("date", todayInOslo())
    .order("date", { ascending: false })
    .order("time", { ascending: false });
  return (data as BookingRequest[]) ?? [];
}

// Course registrations carry no date of their own, so each one is dated by the
// course session it was made for. Registrations whose course date cannot be
// determined count as upcoming, so they are never hidden away.
async function loadDatedRegistrations(): Promise<DatedCourseRegistration[]> {
  const supabase = await createClient();
  const [registrations, courses] = await Promise.all([
    // select(*) so the optional session_label column never breaks the query.
    supabase.from("course_registrations").select("*").order("created_at", { ascending: false }),
    supabase.from("courses").select("id, slug, start_date, end_date, sessions"),
  ]);

  const courseRows = (courses.data as CourseDateRow[] | null) ?? [];
  const byId = new Map(courseRows.map((course) => [course.id, course]));
  const bySlug = new Map(courseRows.map((course) => [course.slug, course]));

  return ((registrations.data as CourseRegistration[]) ?? []).map((row) => {
    const course = (row.course_id ? byId.get(row.course_id) : undefined) ?? bySlug.get(row.course_slug);
    return {
      ...row,
      session_label: row.session_label ?? null,
      course_date: resolveRegistrationDate(row.session_label ?? null, course),
    };
  });
}

// Registrations for courses that have not finished yet, soonest course first.
export async function getCourseRegistrations(): Promise<DatedCourseRegistration[]> {
  const today = todayInOslo();
  const registrations = await loadDatedRegistrations();
  return registrations
    .filter((row) => !row.course_date || row.course_date >= today)
    .sort((a, b) => (a.course_date ?? "9999").localeCompare(b.course_date ?? "9999"));
}

// Registrations for courses that are over, most recent course first.
export async function getPastCourseRegistrations(): Promise<DatedCourseRegistration[]> {
  const today = todayInOslo();
  const registrations = await loadDatedRegistrations();
  return registrations
    .filter((row) => row.course_date !== null && row.course_date < today)
    .sort((a, b) => (b.course_date ?? "").localeCompare(a.course_date ?? ""));
}

// Today and later, oldest first — the days that still affect the website.
export async function getAvailabilityDays(): Promise<AvailabilityDay[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_days")
    .select("id, date, is_closed, slots")
    .gte("date", todayInOslo())
    .order("date", { ascending: true });
  return (data as AvailabilityDay[]) ?? [];
}

// Everything before today, newest first.
export async function getPastAvailabilityDays(): Promise<AvailabilityDay[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_days")
    .select("id, date, is_closed, slots")
    .lt("date", todayInOslo())
    .order("date", { ascending: false });
  return (data as AvailabilityDay[]) ?? [];
}
