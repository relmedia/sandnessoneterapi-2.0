export interface BookingServiceOption {
  value: string;
  label: string;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const PHONE_PATTERN = /^[\d\s+()-]{8,16}$/;

export interface BookingPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  message?: string;
  turnstileToken?: string;
}

export function formatDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isDateInPast(date: Date, now = new Date()): boolean {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const candidate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return candidate < today;
}

export function getDefaultAvailabilityRange(now = new Date()): { from: string; to: string } {
  const from = formatDateIso(now);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  end.setDate(end.getDate() + 120);
  return { from, to: formatDateIso(end) };
}

export function parseDateParam(value: string | null): string | null {
  if (!value || !DATE_PATTERN.test(value)) return null;
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return value;
}

export function getAvailableSlotsForDate(
  adminSlots: string[],
  date: Date,
  bookedTimes: string[],
  now = new Date(),
): string[] {
  if (isDateInPast(date, now) || adminSlots.length === 0) return [];

  const uniqueSlots = [...new Set(adminSlots)].sort();
  const isToday = formatDateIso(date) === formatDateIso(now);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return uniqueSlots.filter((slot) => {
    if (bookedTimes.includes(slot)) return false;
    if (!isToday) return true;

    const [hour, minute] = slot.split(":").map(Number);
    return hour > currentHour || (hour === currentHour && minute > currentMinute);
  });
}

export function validateBookingPayload(
  data: unknown,
  validServices: readonly string[],
): { ok: true; value: BookingPayload } | { ok: false; error: string } {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Ugyldig forespørsel." };
  }

  const payload = data as Record<string, unknown>;

  // Honeypot field: bots fill it, humans never see it.
  if (typeof payload.website === "string" && payload.website.trim().length > 0) {
    return { ok: false, error: "Forespørselen ble avvist." };
  }

  const firstName = typeof payload.firstName === "string" ? payload.firstName.trim() : "";
  const lastName = typeof payload.lastName === "string" ? payload.lastName.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  const service = typeof payload.service === "string" ? payload.service.trim() : "";
  const date = typeof payload.date === "string" ? payload.date.trim() : "";
  const time = typeof payload.time === "string" ? payload.time.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";
  const turnstileToken = typeof payload.turnstileToken === "string" ? payload.turnstileToken.trim() : "";

  if (firstName.length < 2 || firstName.length > 80) {
    return { ok: false, error: "Oppgi et gyldig fornavn." };
  }

  if (lastName.length < 2 || lastName.length > 80) {
    return { ok: false, error: "Oppgi et gyldig etternavn." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Oppgi en gyldig e-postadresse." };
  }

  if (!PHONE_PATTERN.test(phone)) {
    return { ok: false, error: "Oppgi et gyldig telefonnummer." };
  }

  if (!validServices.includes(service)) {
    return { ok: false, error: "Velg en behandling." };
  }

  if (!DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) {
    return { ok: false, error: "Velg gyldig dato og klokkeslett." };
  }

  const parsedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime()) || isDateInPast(parsedDate)) {
    return { ok: false, error: "Datoen er ikke tilgjengelig for booking." };
  }

  if (message.length > 1000) {
    return { ok: false, error: "Meldingen er for lang." };
  }

  return {
    ok: true,
    value: {
      firstName,
      lastName,
      email,
      phone,
      service,
      date,
      time,
      message: message || undefined,
      turnstileToken: turnstileToken || undefined,
    },
  };
}

const BOOKING_TOKEN_PATTERN = /^[a-f0-9-]{36}$/i;

export interface CancelLookupPayload {
  email: string;
  date: string;
  phone: string;
}

export function isValidBookingToken(token: string): boolean {
  return BOOKING_TOKEN_PATTERN.test(token);
}

export function isValidCancelToken(token: string): boolean {
  return isValidBookingToken(token);
}

export function validateCancelLookup(
  data: unknown,
): { ok: true; value: CancelLookupPayload } | { ok: false; error: string } {
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Ugyldig forespørsel." };
  }

  const payload = data as Record<string, unknown>;

  if (typeof payload.website === "string" && payload.website.trim().length > 0) {
    return { ok: false, error: "Forespørselen ble avvist." };
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const date = typeof payload.date === "string" ? payload.date.trim() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Oppgi en gyldig e-postadresse." };
  }

  if (!DATE_PATTERN.test(date)) {
    return { ok: false, error: "Oppgi en gyldig dato." };
  }

  if (!PHONE_PATTERN.test(phone)) {
    return { ok: false, error: "Oppgi et gyldig telefonnummer." };
  }

  return { ok: true, value: { email, date, phone } };
}

export function canCancelBookingStatus(status: string | undefined): boolean {
  return status === "pending" || status === "confirmed";
}

export function formatDateNbLong(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
