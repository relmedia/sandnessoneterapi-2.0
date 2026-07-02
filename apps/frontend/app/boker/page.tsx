import type { Metadata } from "next";

import { BokerBookActions } from "@/components/boker-book-actions";
import { ReadMore } from "@/components/read-more";
import { getBooks, getSettings } from "@/lib/content";
import { isBookOrderOnline } from "@/lib/book-order";
import { formatDateNb, formatPhone, telHref } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Bøker",
  description: "Bøker om soneterapi og tankefeltterapi av Terje Horpestad.",
};

export default async function BokerPage() {
  const [books, settings] = await Promise.all([getBooks(), getSettings()]);
  const phoneDisplay = formatPhone(settings.phone);
  const phoneTel = telHref(settings.phone);
  const hasOnlineBooks = books.some((book) => isBookOrderOnline(book));

  return (
    <div className="py-16 md:py-24">
      <div className="container-wide section-padding mx-auto">
        <p className="text-label mb-4">Litteratur</p>
        <h1 className="text-heading-display mb-4">Bøker</h1>
        <p className="text-body-lg mb-16 max-w-xl">
          Terje Horpestad har skrevet to bøker om soneterapi og ett hefte om tankefeltterapi.
          {hasOnlineBooks
            ? " Bestill online og betal med Vipps, eller ring oss."
            : phoneDisplay
              ? ` Kan bestilles ved å ringe ${phoneDisplay}.`
              : ""}
        </p>

        <div className="flex flex-col gap-16">
          {books.length > 0 ? (
            books.map((book) => (
              <article key={book.id} className="grid items-start gap-10 md:grid-cols-[280px_1fr]">
                <div className="flex flex-col gap-4">
                  {book.cover_image_url ? (
                    <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl bg-sage-light">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="size-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center rounded-2xl bg-sage-light/40">
                      <span className="text-5xl" aria-hidden="true">
                        📖
                      </span>
                    </div>
                  )}
                  <BokerBookActions
                    bookRef={book.slug}
                    bookTitle={book.title}
                    bookPrice={book.price}
                    orderOnline={book.order_online}
                    phoneDisplay={phoneDisplay}
                    phoneTel={phoneTel}
                  />
                </div>
                <div>
                  <h2 className="text-heading-page mb-3 md:text-4xl">{book.title}</h2>
                  <div className="font-sans text-sm font-normal text-stone/70 mb-6 flex flex-wrap gap-4 tracking-widest uppercase">
                    {book.isbn && <span>ISBN {book.isbn}</span>}
                    {book.published_date && <span>Utgitt {formatDateNb(book.published_date)}</span>}
                    {book.pages && <span>{book.pages} sider</span>}
                    {book.price != null && <span className="text-sage-dark">{book.price} kr</span>}
                  </div>
                  {book.description && (
                    <ReadMore>
                      <div
                        className="prose-content"
                        dangerouslySetInnerHTML={{ __html: book.description }}
                      />
                    </ReadMore>
                  )}
                </div>
              </article>
            ))
          ) : (
            <p className="text-body-sm">Bøker legges til snart.</p>
          )}
        </div>
      </div>
    </div>
  );
}
