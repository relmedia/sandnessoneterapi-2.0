import { NextResponse, type NextRequest } from "next/server";

import {
  getAvailableSlotsForDate,
  validateBookingPayload,
} from "@/lib/booking";
import { isEmailConfigured, sendBookingConfirmationEmails } from "@/lib/booking-email";
import {
  createBookingClient,
  getAdminSlotsForDay,
  getAvailabilityDay,
  getBookedTimes,
} from "@/lib/booking-store";
import { getServices } from "@/lib/content";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Ugyldig dato." }, { status: 400 });
  }

  const parsedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Ugyldig dato." }, { status: 400 });
  }

  const supabase = createBookingClient();
  if (!supabase) {
    return NextResponse.json({ error: "Timebestilling er ikke aktivert ennå." }, { status: 503 });
  }

  const availability = await getAvailabilityDay(supabase, date);
  const adminSlots = getAdminSlotsForDay(availability);
  const bookedTimes = await getBookedTimes(supabase, date);
  const slots = getAvailableSlotsForDate(adminSlots, parsedDate, bookedTimes);

  return NextResponse.json({ date, slots });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const services = await getServices();

  const validation = validateBookingPayload(
    body,
    services.map((item) => item.slug),
  );
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const supabase = createBookingClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Timebestilling er ikke aktivert ennå. Ring oss for å avtale time." },
      { status: 503 },
    );
  }

  const { firstName, lastName, email, phone, service, date, time, message } = validation.value;

  const availability = await getAvailabilityDay(supabase, date);
  const adminSlots = getAdminSlotsForDay(availability);

  if (adminSlots.length === 0) {
    return NextResponse.json({ error: "Datoen er ikke tilgjengelig for booking." }, { status: 409 });
  }

  const bookedTimes = await getBookedTimes(supabase, date);
  const parsedDate = new Date(`${date}T12:00:00`);
  const available = getAvailableSlotsForDate(adminSlots, parsedDate, bookedTimes);

  if (!available.includes(time)) {
    return NextResponse.json({ error: "Tidspunktet er ikke lenger tilgjengelig." }, { status: 409 });
  }

  const serviceLabel = services.find((item) => item.slug === service)?.title ?? service;

  const { data: created, error } = await supabase
    .from("booking_requests")
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone.replace(/\D/g, ""),
      service: serviceLabel,
      date,
      time,
      message: message ?? null,
      status: "pending",
    })
    .select("cancel_token, confirm_token")
    .single();

  if (error || !created) {
    console.error("[booking] Insert failed:", error);
    return NextResponse.json({ error: "Kunne ikke lagre bestillingen. Prøv igjen." }, { status: 500 });
  }

  const cancelToken = created.cancel_token as string;
  const confirmToken = created.confirm_token as string;

  let emailsSent = false;
  if (await isEmailConfigured()) {
    const result = await sendBookingConfirmationEmails(
      {
        firstName,
        lastName,
        email,
        phone,
        serviceLabel,
        date,
        time,
        message,
        cancelToken,
        confirmToken,
      },
      null,
    );
    emailsSent = result.customerSent;
  } else {
    console.warn("[booking] Email not configured. Set RESEND_API_KEY and EMAIL_FROM to enable.");
  }

  return NextResponse.json({
    ok: true,
    message: emailsSent
      ? "Timeforespørselen er sendt. Du får bekreftelse på e-post, og Terje tar kontakt for å bekrefte timen."
      : "Timeforespørselen er sendt. Terje tar kontakt for å bekrefte timen.",
    cancelToken,
    emailsSent,
  });
}
