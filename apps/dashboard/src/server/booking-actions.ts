"use server";

import { revalidatePath } from "next/cache";

import { sendBookingConfirmedEmailFromDashboard } from "@/lib/booking-email";
import { createClient } from "@/lib/supabase/server";
import type { BookingStatus } from "@/types/booking";

export type ActionResult = { ok: true } | { ok: false; error: string };

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const BOOKING_SELECT =
  "id, first_name, last_name, email, phone, service, date, time, message, status, cancel_token, confirm_token, created_at, cancelled_at";

// ---------------- Bookings (Bestillinger) ----------------

export async function setBookingStatus(id: string, status: BookingStatus): Promise<ActionResult> {
  if (!["pending", "confirmed", "cancelled"].includes(status)) {
    return { ok: false, error: "Ugyldig status." };
  }

  const supabase = await createClient();

  if (status === "confirmed") {
    const { data: existing, error: fetchError } = await supabase
      .from("booking_requests")
      .select(BOOKING_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return { ok: false, error: fetchError.message };
    if (!existing) return { ok: false, error: "Fant ikke bestillingen." };

    const wasPending = existing.status === "pending";

    const { error } = await supabase
      .from("booking_requests")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        cancelled_at: null,
      })
      .eq("id", id);

    if (error) return { ok: false, error: error.message };

    if (wasPending) {
      const emailSent = await sendBookingConfirmedEmailFromDashboard({
        firstName: existing.first_name,
        lastName: existing.last_name,
        email: existing.email,
        phone: existing.phone,
        serviceLabel: existing.service,
        date: existing.date,
        time: existing.time,
        message: existing.message,
        cancelToken: existing.cancel_token,
        confirmToken: existing.confirm_token ?? "",
      });

      if (!emailSent) {
        console.warn("[dashboard] Booking confirmed but confirmation email was not sent.");
      }
    }

    revalidatePath("/dashboard/bestillinger");
    return { ok: true };
  }

  const { error } = await supabase
    .from("booking_requests")
    .update({
      status,
      cancelled_at: status === "cancelled" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/bestillinger");
  return { ok: true };
}

export async function deleteBooking(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("booking_requests").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/bestillinger");
  return { ok: true };
}

// ---------------- Course registrations (Kurspåmeldinger) ----------------

export async function setCourseRegistrationStatus(id: string, status: BookingStatus): Promise<ActionResult> {
  if (!["pending", "confirmed", "cancelled"].includes(status)) {
    return { ok: false, error: "Ugyldig status." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("course_registrations")
    .update({
      status,
      cancelled_at: status === "cancelled" ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/kurspameldinger");
  return { ok: true };
}

export async function deleteCourseRegistration(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("course_registrations").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/kurspameldinger");
  return { ok: true };
}

// ---------------- Availability (Ledige dager) ----------------

export async function saveAvailabilityDay(formData: FormData): Promise<ActionResult> {
  const date = ((formData.get("date") as string | null) ?? "").trim();
  const isClosed = formData.get("is_closed") === "on";
  const slots = formData
    .getAll("slots")
    .map((value) => String(value))
    .filter((value) => TIME_PATTERN.test(value))
    .sort();

  if (!DATE_PATTERN.test(date)) {
    return { ok: false, error: "Oppgi en gyldig dato." };
  }

  if (!isClosed && slots.length === 0) {
    return { ok: false, error: "Legg til minst ett klokkeslett, eller merk dagen som stengt." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("availability_days").upsert(
    {
      date,
      is_closed: isClosed,
      slots: isClosed ? [] : slots,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "date" },
  );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/ledige-dager");
  return { ok: true };
}

export async function deleteAvailabilityDay(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("availability_days").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/ledige-dager");
  return { ok: true };
}
