import "server-only";

import {
  getBookOrderTotalNok,
  getBookShippingFeeNok,
  isBookOrderOnline,
  type BookOrderPayload,
} from "@/lib/book-order";
import { sendBookOrderPlacedEmails } from "@/lib/book-order-email";
import { createBookingClient } from "@/lib/booking-store";
import { getBookBySlug } from "@/lib/content";
import { getVippsNumberDisplay } from "@/lib/vipps-number";

export async function createBookOrder(input: {
  bookRef: string;
  payload: BookOrderPayload;
}): Promise<
  | { ok: true; orderId: string; totalNok: number; vippsNumber: string; status: "pending_payment" }
  | { ok: false; error: string; status?: number }
> {
  const supabase = createBookingClient();
  if (!supabase) {
    return {
      ok: false,
      status: 503,
      error: "Nettbestilling er ikke aktivert ennå. Ring oss for å bestille.",
    };
  }

  const book = await getBookBySlug(input.bookRef);
  if (!book) {
    return { ok: false, status: 404, error: "Boken ble ikke funnet." };
  }

  if (!isBookOrderOnline(book)) {
    return {
      ok: false,
      status: 409,
      error: "Denne boken kan ikke bestilles online. Ring oss i stedet.",
    };
  }

  const bookPrice = book.price ?? 0;
  const shippingFee = getBookShippingFeeNok();
  const totalNok = getBookOrderTotalNok(bookPrice, shippingFee);
  const vippsNumber = getVippsNumberDisplay();

  const { data, error } = await supabase
    .from("book_orders")
    .insert({
      book_id: book.id,
      book_slug: book.slug,
      book_title: book.title,
      book_price: bookPrice,
      shipping_fee: shippingFee,
      name: input.payload.name,
      last_name: input.payload.lastName,
      email: input.payload.email,
      phone: input.payload.phone.replace(/\D/g, ""),
      address_line1: input.payload.addressLine1,
      postal_code: input.payload.postalCode,
      city: input.payload.city,
      message: input.payload.message ?? null,
      status: "pending_payment",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, status: 500, error: error?.message ?? "Kunne ikke lagre bestillingen." };
  }

  await sendBookOrderPlacedEmails({
    name: input.payload.name,
    lastName: input.payload.lastName,
    email: input.payload.email,
    phone: input.payload.phone,
    bookTitle: book.title,
    bookPrice,
    shippingFee,
    totalNok,
    vippsNumber,
    status: "pending_payment",
    addressLine1: input.payload.addressLine1,
    postalCode: input.payload.postalCode,
    city: input.payload.city,
    message: input.payload.message,
  });

  return {
    ok: true,
    orderId: data.id,
    totalNok,
    vippsNumber,
    status: "pending_payment",
  };
}
