import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingConfetti } from "@/components/booking-confetti";
import { isValidCancelToken } from "@/lib/booking";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export const metadata = {
  title: "Timeforespørsel mottatt",
  description: "Takk for timebestillingen hos Sandnes Soneterapi.",
};

export default async function BookingSuccessPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token || !isValidCancelToken(token)) {
    notFound();
  }

  return (
    <div className="py-16 md:py-24">
      <BookingConfetti />
      <div className="container-wide section-padding mx-auto">
        <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-sage/20 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-sage-light">
            <svg
              className="h-7 w-7 text-sage-dark"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-heading-page mb-3">Takk for bestillingen!</h1>
          <p className="text-body-sm mb-8">
            Timeforespørselen er mottatt. Du får en bekreftelse på e-post med detaljer og avbestillingskode.
            Terje tar kontakt for å bekrefte dato og tid.
          </p>

          <div className="mb-8 rounded-xl border border-stone/10 bg-cream/60 p-5 text-left">
            <p className="mb-2 font-sans text-xs uppercase tracking-widest text-sage">Avbestilling</p>
            <p className="text-body-sm mb-4">Lagre denne lenken om du må avbestille senere:</p>
            <Link
              href={`/avbestill?token=${encodeURIComponent(token)}`}
              className="inline-block break-all font-sans text-sm text-sage-dark underline underline-offset-2"
            >
              Avbestill timen
            </Link>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/bestill-time"
              className="inline-flex rounded-full bg-stone px-6 py-3 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage-dark"
            >
              Bestill ny time
            </Link>
            <Link href="/avbestill" className="text-body-sm transition-colors hover:text-sage-dark">
              Avbestill uten lenke
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
