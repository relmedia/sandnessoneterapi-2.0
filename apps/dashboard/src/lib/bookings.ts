import { createClient } from "@/lib/supabase/server";
import type { AvailabilityDay, BookingRequest, CourseRegistration } from "@/types/booking";

export type PendingCounts = {
  bookings: number;
  courseRegistrations: number;
};

// Pending (unhandled) requests, shown as sidebar badges.
export async function getPendingCounts(): Promise<PendingCounts> {
  const supabase = await createClient();
  const [bookings, registrations] = await Promise.all([
    supabase.from("booking_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("course_registrations").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  return {
    bookings: bookings.count ?? 0,
    courseRegistrations: registrations.count ?? 0,
  };
}

export async function getBookingRequests(): Promise<BookingRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_requests")
    .select(
      "id, first_name, last_name, email, phone, service, date, time, message, status, cancel_token, confirm_token, confirmed_at, created_at, cancelled_at",
    )
    .order("date", { ascending: false })
    .order("time", { ascending: false });
  return (data as BookingRequest[]) ?? [];
}

export async function getCourseRegistrations(): Promise<CourseRegistration[]> {
  const supabase = await createClient();
  // select(*) so the optional session_label column never breaks the query.
  const { data } = await supabase
    .from("course_registrations")
    .select("*")
    .order("created_at", { ascending: false });
  return ((data as CourseRegistration[]) ?? []).map((row) => ({
    ...row,
    session_label: row.session_label ?? null,
  }));
}

export async function getAvailabilityDays(): Promise<AvailabilityDay[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability_days")
    .select("id, date, is_closed, slots")
    .order("date", { ascending: true });
  return (data as AvailabilityDay[]) ?? [];
}
