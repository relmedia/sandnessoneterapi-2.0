import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface AvailabilityDayRecord {
  date: string;
  is_closed: boolean;
  slots: string[];
}

export interface BookingRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  message: string | null;
  status: string;
  cancel_token: string;
  confirm_token: string;
  confirmed_at: string | null;
}

// Bookings contain personal data, so the tables have no anon RLS policies.
// All access from the public site goes through API routes using this
// server-only service-role client.
export function createBookingClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return null;
  return createClient(url, secret, { auth: { persistSession: false } });
}

export async function getAvailabilityDay(
  supabase: SupabaseClient,
  date: string,
): Promise<AvailabilityDayRecord | null> {
  const { data } = await supabase
    .from("availability_days")
    .select("date, is_closed, slots")
    .eq("date", date)
    .maybeSingle();
  return (data as AvailabilityDayRecord | null) ?? null;
}

export async function getAvailabilityRange(
  supabase: SupabaseClient,
  from: string,
  to: string,
): Promise<AvailabilityDayRecord[]> {
  const { data } = await supabase
    .from("availability_days")
    .select("date, is_closed, slots")
    .gte("date", from)
    .lte("date", to)
    .eq("is_closed", false)
    .order("date", { ascending: true });
  const days = (data as AvailabilityDayRecord[] | null) ?? [];
  return days.filter((day) => day.slots.length > 0);
}

export function getAdminSlotsForDay(record: AvailabilityDayRecord | null): string[] {
  if (!record || record.is_closed) return [];
  const slots = record.slots ?? [];
  return [...new Set(slots.filter((slot) => typeof slot === "string" && slot.length > 0))].sort();
}

export async function getBookedTimes(supabase: SupabaseClient, date: string): Promise<string[]> {
  const { data } = await supabase
    .from("booking_requests")
    .select("time")
    .eq("date", date)
    .neq("status", "cancelled");
  return ((data as { time: string }[] | null) ?? []).map((row) => row.time);
}

const BOOKING_COLUMNS =
  "id, first_name, last_name, email, phone, service, date, time, message, status, cancel_token, confirm_token, confirmed_at";

export async function findBookingByToken(
  supabase: SupabaseClient,
  token: string,
): Promise<BookingRecord | null> {
  const { data } = await supabase
    .from("booking_requests")
    .select(BOOKING_COLUMNS)
    .eq("cancel_token", token)
    .maybeSingle();
  return (data as BookingRecord | null) ?? null;
}

export async function findBookingByConfirmToken(
  supabase: SupabaseClient,
  token: string,
): Promise<BookingRecord | null> {
  const { data } = await supabase
    .from("booking_requests")
    .select(BOOKING_COLUMNS)
    .eq("confirm_token", token)
    .maybeSingle();
  return (data as BookingRecord | null) ?? null;
}

export async function findBookingByLookup(
  supabase: SupabaseClient,
  lookup: { email: string; date: string; phone: string },
): Promise<BookingRecord | null> {
  const { data } = await supabase
    .from("booking_requests")
    .select(BOOKING_COLUMNS)
    .ilike("email", lookup.email)
    .eq("date", lookup.date)
    .eq("phone", lookup.phone.replace(/\D/g, ""))
    .limit(1)
    .maybeSingle();
  return (data as BookingRecord | null) ?? null;
}
