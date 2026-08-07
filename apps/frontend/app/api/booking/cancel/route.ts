import { NextResponse, type NextRequest } from "next/server";

import { canCancelBookingStatus, isValidCancelToken, validateCancelLookup } from "@/lib/booking";
import {
  type BookingRecord,
  createBookingClient,
  findBookingByLookup,
  findBookingByToken,
} from "@/lib/booking-store";
import {
  getRequestIp,
  isTurnstileConfigured,
  readTurnstileToken,
  verifyTurnstileToken,
} from "@/lib/turnstile";

function bookingSummary(booking: BookingRecord) {
  return {
    service: booking.service,
    date: booking.date,
    time: booking.time,
    status: booking.status,
    canCancel: canCancelBookingStatus(booking.status),
  };
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || !isValidCancelToken(token)) {
    return NextResponse.json({ error: "Mangler avbestillingskode." }, { status: 400 });
  }

  const supabase = createBookingClient();
  if (!supabase) {
    return NextResponse.json({ error: "Avbestilling er ikke tilgjengelig akkurat nå." }, { status: 503 });
  }

  const booking = await findBookingByToken(supabase, token);
  if (!booking) {
    return NextResponse.json({ error: "Fant ingen time med denne koden." }, { status: 404 });
  }

  return NextResponse.json({ booking: bookingSummary(booking) });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  if (isTurnstileConfigured()) {
    const turnstileToken = readTurnstileToken(body);
    if (!turnstileToken) {
      return NextResponse.json({ error: "Bekreft at du ikke er en robot." }, { status: 400 });
    }

    const isHuman = await verifyTurnstileToken(turnstileToken, getRequestIp(request));
    if (!isHuman) {
      return NextResponse.json({ error: "Sikkerhetskontrollen feilet. Prøv igjen." }, { status: 400 });
    }
  }

  const supabase = createBookingClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Avbestilling er ikke tilgjengelig akkurat nå. Ring oss for hjelp." },
      { status: 503 },
    );
  }

  const payload = body as Record<string, unknown>;
  let booking: BookingRecord | null = null;

  if (typeof payload.token === "string" && payload.token.trim()) {
    const token = payload.token.trim();
    booking = isValidCancelToken(token) ? await findBookingByToken(supabase, token) : null;
  } else {
    const validation = validateCancelLookup(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    booking = await findBookingByLookup(supabase, validation.value);
  }

  if (!booking) {
    return NextResponse.json({ error: "Fant ingen time som matcher opplysningene." }, { status: 404 });
  }

  if (!canCancelBookingStatus(booking.status)) {
    return NextResponse.json(
      {
        error:
          booking.status === "cancelled" ? "Timen er allerede avbestilt." : "Timen kan ikke avbestilles.",
      },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("booking_requests")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", booking.id);

  if (error) {
    return NextResponse.json({ error: "Kunne ikke avbestille. Prøv igjen." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "Timen er avbestilt.",
    booking: bookingSummary({ ...booking, status: "cancelled" }),
  });
}
