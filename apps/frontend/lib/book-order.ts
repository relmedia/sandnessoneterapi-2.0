export const DEFAULT_BOOK_SHIPPING_FEE_NOK = 69;

export type BookOrderStatus = "pending_payment" | "paid" | "cancelled";

export interface BookOrderPayload {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  postalCode: string;
  city: string;
  message?: string;
  website?: string;
  turnstileToken?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[\d\s+()-]{8,16}$/;
const POSTAL_CODE_PATTERN = /^\d{4}$/;

export function getBookShippingFeeNok(): number {
  const configured = Number(process.env.BOOK_SHIPPING_FEE_NOK);
  if (Number.isFinite(configured) && configured >= 0) {
    return configured;
  }
  return DEFAULT_BOOK_SHIPPING_FEE_NOK;
}

export function isBookOrderOnline(book: {
  order_online?: boolean | null;
  price?: number | null;
}): boolean {
  return book.order_online === true && typeof book.price === "number" && book.price > 0;
}

export function canShowBookOrderButton(
  book: {
    order_online?: boolean | null;
    price?: number | null;
  },
  bookRef?: string,
): boolean {
  return Boolean(bookRef) && isBookOrderOnline(book);
}

export function getBookOrderTotalNok(bookPrice: number, shippingFee = getBookShippingFeeNok()): number {
  return bookPrice + shippingFee;
}

export function formatBookOrderStatus(status: BookOrderStatus): string {
  switch (status) {
    case "pending_payment":
      return "Venter betaling";
    case "paid":
      return "Betalt";
    case "cancelled":
      return "Avbrutt";
    default:
      return status;
  }
}

export function formatShippingAddress(order: {
  addressLine1: string;
  postalCode: string;
  city: string;
}): string {
  return `${order.addressLine1}, ${order.postalCode} ${order.city}`;
}

export function validateBookOrderPayload(
  body: unknown,
): { ok: true; value: BookOrderPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Ugyldig forespørsel." };
  }

  const input = body as Record<string, unknown>;

  if (typeof input.website === "string" && input.website.trim()) {
    return { ok: false, error: "Kunne ikke sende skjemaet." };
  }

  const name = typeof input.name === "string" ? input.name.trim() : "";
  const lastName = typeof input.lastName === "string" ? input.lastName.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const addressLine1 = typeof input.addressLine1 === "string" ? input.addressLine1.trim() : "";
  const postalCode = typeof input.postalCode === "string" ? input.postalCode.trim() : "";
  const city = typeof input.city === "string" ? input.city.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : undefined;
  const turnstileToken =
    typeof input.turnstileToken === "string" ? input.turnstileToken.trim() : undefined;

  if (!name) return { ok: false, error: "Fornavn er påkrevd." };
  if (!lastName) return { ok: false, error: "Etternavn er påkrevd." };
  if (!email || !EMAIL_PATTERN.test(email)) return { ok: false, error: "Ugyldig e-postadresse." };
  if (!phone || !PHONE_PATTERN.test(phone)) return { ok: false, error: "Ugyldig telefonnummer." };
  if (!addressLine1) return { ok: false, error: "Adresse er påkrevd." };
  if (!postalCode || !POSTAL_CODE_PATTERN.test(postalCode)) {
    return { ok: false, error: "Ugyldig postnummer." };
  }
  if (!city) return { ok: false, error: "Poststed er påkrevd." };

  return {
    ok: true,
    value: {
      name,
      lastName,
      email,
      phone,
      addressLine1,
      postalCode,
      city,
      message: message || undefined,
      turnstileToken: turnstileToken || undefined,
    },
  };
}
