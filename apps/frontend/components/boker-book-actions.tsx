"use client";

import { BookOrderTrigger } from "@/components/book-order-modal";
import {
  canShowBookOrderButton,
  DEFAULT_BOOK_SHIPPING_FEE_NOK,
} from "@/lib/book-order";

type BokerBookActionsProps = {
  bookRef: string;
  bookTitle: string;
  bookPrice?: number | null;
  orderOnline?: boolean | null;
  phoneDisplay: string;
  phoneTel: string;
  shippingFee?: number;
};

export function BokerBookActions({
  bookRef,
  bookTitle,
  bookPrice,
  orderOnline,
  phoneDisplay,
  phoneTel,
  shippingFee = DEFAULT_BOOK_SHIPPING_FEE_NOK,
}: BokerBookActionsProps) {
  const canOrderOnline = canShowBookOrderButton(
    { order_online: orderOnline, price: bookPrice ?? undefined },
    bookRef,
  );

  return (
    <div className="flex flex-col gap-3">
      {canOrderOnline && typeof bookPrice === "number" && (
        <BookOrderTrigger
          bookRef={bookRef}
          bookTitle={bookTitle}
          bookPrice={bookPrice}
          shippingFee={shippingFee}
          phoneDisplay={phoneDisplay}
          phoneTel={phoneTel}
        />
      )}
      <a
        href={`tel:${phoneTel}`}
        className={`inline-block w-full rounded-full px-6 py-3 text-center font-sans text-sm font-normal tracking-wide transition-colors ${
          canOrderOnline
            ? "border border-stone/15 bg-white text-stone hover:border-sage hover:text-sage-dark"
            : "bg-sage text-cream hover:bg-sage-dark"
        }`}
      >
        Bestill på tlf {phoneDisplay}
      </a>
    </div>
  );
}
