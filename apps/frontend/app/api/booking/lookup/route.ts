import { NextResponse } from "next/server";

import { canCancelBookingStatus, validateCancelLookup } from "@/lib/booking";
import { createBookingClient, findBookingByLookup } from "@/lib/booking-store";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const validation = validateCancelLookup(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const supabase = createBookingClient();
  if (!supabase) {
    return NextResponse.json({ error: "Avbestilling er ikke tilgjengelig akkurat nå." }, { status: 503 });
  }

  const booking = await findBookingByLookup(supabase, validation.value);

  if (!booking) {
    return NextResponse.json({ error: "Fant ingen time som matcher opplysningene." }, { status: 404 });
  }

  return NextResponse.json({
    booking: {
      service: booking.service,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      canCancel: canCancelBookingStatus(booking.status),
    },
  });
}
