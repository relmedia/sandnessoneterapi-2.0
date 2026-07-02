import { NextResponse, type NextRequest } from "next/server";

import {
  getBookOrderTotalNok,
  getBookShippingFeeNok,
  isBookOrderOnline,
  validateBookOrderPayload,
} from "@/lib/book-order";
import { createBookOrder } from "@/lib/book-order-service";
import { getBookBySlug } from "@/lib/content";
import { getVippsNumberDisplay } from "@/lib/vipps-number";
import { getRequestIp, isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const book = await getBookBySlug(slug);

  if (!book) {
    return NextResponse.json({ error: "Boken ble ikke funnet." }, { status: 404 });
  }

  const bookPrice = book.price ?? null;
  const shippingFee = getBookShippingFeeNok();

  return NextResponse.json({
    orderOnline: isBookOrderOnline(book),
    bookPrice,
    shippingFee,
    totalPrice: typeof bookPrice === "number" ? getBookOrderTotalNok(bookPrice, shippingFee) : null,
    vippsNumber: getVippsNumberDisplay(),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON." }, { status: 400 });
  }

  const validation = validateBookOrderPayload(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  if (isTurnstileConfigured()) {
    const token = validation.value.turnstileToken;
    if (!token) {
      return NextResponse.json({ error: "Bekreft at du ikke er en robot." }, { status: 400 });
    }

    const isHuman = await verifyTurnstileToken(token, getRequestIp(request));
    if (!isHuman) {
      return NextResponse.json({ error: "Sikkerhetskontrollen feilet. Prøv igjen." }, { status: 400 });
    }
  }

  const result = await createBookOrder({
    bookRef: slug,
    payload: validation.value,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({
    ok: true,
    status: result.status,
    orderId: result.orderId,
    totalNok: result.totalNok,
    vippsNumber: result.vippsNumber,
  });
}
