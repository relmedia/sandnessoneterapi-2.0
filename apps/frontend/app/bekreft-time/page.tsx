import type { Metadata } from "next";

import Link from "next/link";

import { formatDateNbLong, isValidBookingToken } from "@/lib/booking";
import { confirmBookingByToken } from "@/lib/booking-confirm";

export const metadata: Metadata = {
  title: "Bekreft timebestilling",
  description: "Bekreft en timebestilling hos Sandnes Soneterapi.",
};

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

function formatBookingSummary(booking: {
  first_name: string;
  last_name: string;
  service: string;
  date: string;
  time: string;
}): string {
  return `${booking.first_name} ${booking.last_name} · ${booking.service} · ${formatDateNbLong(booking.date)} kl. ${booking.time}`;
}

export default async function BekreftTimePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token || !isValidBookingToken(token)) {
    return (
      <ResultCard
        tone="error"
        title="Ugyldig lenke"
        description="Bekreftelseslenken er ugyldig eller utløpt. Gå til dashbordet for å bekrefte timen manuelt."
      />
    );
  }

  let result;
  try {
    result = await confirmBookingByToken(token);
  } catch {
    return (
      <ResultCard
        tone="error"
        title="Noe gikk galt"
        description="Kunne ikke bekrefte timebestillingen akkurat nå. Prøv igjen, eller bekreft timen i dashbordet."
      />
    );
  }

  if (result.status === "not_found") {
    return (
      <ResultCard
        tone="error"
        title="Fant ikke bestillingen"
        description="Timebestillingen finnes ikke, eller lenken er ugyldig."
      />
    );
  }

  if (result.status === "cancelled") {
    return (
      <ResultCard
        tone="warning"
        title="Kan ikke bekreftes"
        description="Timebestillingen er avbestilt og kan ikke bekreftes."
      />
    );
  }

  if (result.status === "already_confirmed") {
    return (
      <ResultCard
        tone="success"
        title="Allerede bekreftet"
        description={`Denne timen er allerede bekreftet.`}
        detail={formatBookingSummary(result.booking)}
      />
    );
  }

  return (
    <ResultCard
      tone="success"
      title="Timen er bekreftet"
      description={
        result.emailSent
          ? "Kunden har fått en e-post med bekreftelse fra Terje."
          : "Timen er bekreftet i systemet. E-post til kunden ble ikke sendt (sjekk e-postinnstillingene)."
      }
      detail={formatBookingSummary(result.booking)}
    />
  );
}

function ResultCard({
  tone,
  title,
  description,
  detail,
}: {
  readonly tone: "success" | "warning" | "error";
  readonly title: string;
  readonly description: string;
  readonly detail?: string;
}) {
  const iconBg =
    tone === "success" ? "bg-sage-light text-sage-dark" : tone === "warning" ? "bg-warm-light text-stone" : "bg-red-50 text-red-700";

  return (
    <div className="py-16 md:py-24">
      <div className="container-wide section-padding mx-auto">
        <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-sage/20 bg-white p-10 text-center shadow-sm">
          <div className={`mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full ${iconBg}`}>
            {tone === "success" ? (
              <svg
                className="h-7 w-7"
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
            ) : (
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            )}
          </div>
          <h1 className="text-heading-page mb-3">{title}</h1>
          <p className="text-body-sm mb-6">{description}</p>
          {detail ? (
            <p className="text-body-sm mb-8 rounded-xl border border-stone/10 bg-cream/60 px-4 py-3 text-stone/90">
              {detail}
            </p>
          ) : null}
          <Link
            href="/"
            className="inline-flex rounded-full bg-stone px-6 py-3 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage-dark"
          >
            Gå til forsiden
          </Link>
        </div>
      </div>
    </div>
  );
}
