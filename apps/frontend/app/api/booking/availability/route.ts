import { NextResponse, type NextRequest } from "next/server";

import { getDefaultAvailabilityRange, parseDateParam } from "@/lib/booking";
import { createBookingClient, getAvailabilityRange } from "@/lib/booking-store";

export async function GET(request: NextRequest) {
  const defaults = getDefaultAvailabilityRange();
  const from = parseDateParam(request.nextUrl.searchParams.get("from")) ?? defaults.from;
  const to = parseDateParam(request.nextUrl.searchParams.get("to")) ?? defaults.to;

  if (from > to) {
    return NextResponse.json({ error: "Ugyldig datoperiode." }, { status: 400 });
  }

  const supabase = createBookingClient();
  if (!supabase) {
    return NextResponse.json({ error: "Timebestilling er ikke aktivert ennå." }, { status: 503 });
  }

  const days = await getAvailabilityRange(supabase, from, to);

  return NextResponse.json({
    from,
    to,
    dates: days.map((day) => day.date),
  });
}
