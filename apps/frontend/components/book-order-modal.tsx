"use client";

import { useEffect, useId, useState } from "react";
import { X } from "lucide-react";

import { BookOrderForm } from "@/components/book-order-form";
import { DEFAULT_BOOK_SHIPPING_FEE_NOK } from "@/lib/book-order";

type BookOrderModalProps = {
  open: boolean;
  onClose: () => void;
  bookRef: string;
  bookTitle: string;
  bookPrice: number;
  shippingFee?: number;
  phoneDisplay: string;
  phoneTel: string;
};

export function BookOrderModal({
  open,
  onClose,
  bookRef,
  bookTitle,
  bookPrice,
  shippingFee = DEFAULT_BOOK_SHIPPING_FEE_NOK,
  phoneDisplay,
  phoneTel,
}: BookOrderModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        className="absolute inset-0 bg-stone/50 backdrop-blur-[2px]"
        aria-label="Lukk bestilling"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-white sm:mx-auto sm:my-auto sm:h-auto sm:max-h-[min(90vh,900px)] sm:max-w-2xl sm:rounded-2xl sm:shadow-xl sm:ring-1 sm:ring-stone/10"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-warm-light px-5 py-4 sm:px-8 sm:py-6">
          <div className="min-w-0 pr-2">
            <p className="text-label mb-1">Bokbestilling</p>
            <h2 id={titleId} className="text-heading-page sm:text-3xl">
              Bestill {bookTitle}
            </h2>
            <p id={descriptionId} className="text-body-sm mt-2">
              Fyll inn opplysninger og leveringsadresse. Etter bestilling betaler du med Vipps til
              vårt Vippsnummer.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-stone/70 transition-colors hover:bg-cream hover:text-stone"
            aria-label="Lukk"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <BookOrderForm
            bookRef={bookRef}
            bookTitle={bookTitle}
            bookPrice={bookPrice}
            shippingFee={shippingFee}
          />
        </div>

        <div className="shrink-0 border-t border-warm-light bg-cream/40 px-5 py-4 text-center sm:px-8">
          <p className="text-caption">
            Foretrekker du telefon?{" "}
            <a
              href={`tel:${phoneTel}`}
              className="text-stone underline-offset-2 transition-colors hover:text-sage-dark hover:underline"
            >
              Ring {phoneDisplay}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

type BookOrderTriggerProps = Omit<BookOrderModalProps, "open" | "onClose"> & {
  className?: string;
};

export function BookOrderTrigger({ className, ...modalProps }: BookOrderTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "inline-block w-full rounded-full bg-[#ff5b24] px-6 py-3 text-center font-sans text-sm font-medium tracking-wide text-white transition-colors hover:bg-[#e55220]"
        }
      >
        Kjøp med Vipps
      </button>
      <BookOrderModal {...modalProps} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
