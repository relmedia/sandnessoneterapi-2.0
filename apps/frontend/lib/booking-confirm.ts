import "server-only";

import { isValidBookingToken } from "@/lib/booking";
import { sendBookingConfirmedEmail } from "@/lib/booking-email";
import { createBookingClient, findBookingByConfirmToken, type BookingRecord } from "@/lib/booking-store";
import { isEmailConfigured } from "@/lib/email-settings";

export type ConfirmBookingResult =
  | { status: "not_found" }
  | { status: "cancelled" }
  | { status: "already_confirmed"; booking: BookingRecord }
  | { status: "confirmed"; booking: BookingRecord; emailSent: boolean };

function toEmailDetails(booking: BookingRecord) {
  return {
    firstName: booking.first_name,
    lastName: booking.last_name,
    email: booking.email,
    phone: booking.phone,
    serviceLabel: booking.service,
    date: booking.date,
    time: booking.time,
    message: booking.message ?? undefined,
    cancelToken: booking.cancel_token,
    confirmToken: booking.confirm_token,
  };
}

export async function confirmBookingByToken(token: string): Promise<ConfirmBookingResult> {
  if (!isValidBookingToken(token)) {
    return { status: "not_found" };
  }

  const supabase = createBookingClient();
  if (!supabase) {
    throw new Error("Booking client is not configured.");
  }

  const booking = await findBookingByConfirmToken(supabase, token);
  if (!booking) return { status: "not_found" };
  if (booking.status === "cancelled") return { status: "cancelled" };
  if (booking.status === "confirmed") return { status: "already_confirmed", booking };

  const confirmedAt = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("booking_requests")
    .update({ status: "confirmed", confirmed_at: confirmedAt })
    .eq("id", booking.id)
    .eq("status", "pending")
    .select(BOOKING_SELECT)
    .maybeSingle();

  if (error) {
    console.error("[booking-confirm] Update failed:", error);
    throw new Error("Kunne ikke bekrefte timebestillingen.");
  }

  if (!updated) {
    const latest = await findBookingByConfirmToken(supabase, token);
    if (latest?.status === "confirmed") {
      return { status: "already_confirmed", booking: latest };
    }
    if (latest?.status === "cancelled") {
      return { status: "cancelled" };
    }
    return { status: "not_found" };
  }

  const confirmedBooking = updated as BookingRecord;
  let emailSent = false;

  if (await isEmailConfigured()) {
    emailSent = await sendBookingConfirmedEmail(toEmailDetails(confirmedBooking));
    if (!emailSent) {
      console.warn("[booking-confirm] Confirmation email failed to send.");
    }
  }

  return { status: "confirmed", booking: confirmedBooking, emailSent };
}

const BOOKING_SELECT =
  "id, first_name, last_name, email, phone, service, date, time, message, status, cancel_token, confirm_token, confirmed_at";
