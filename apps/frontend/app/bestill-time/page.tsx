import type { Metadata } from "next";

import Link from "next/link";

import { BookingForm } from "@/components/booking-form";
import { getServices, getSettings } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Bestill time",
  description: "Bestill time for soneterapi, øreakupunktur eller tankefeltterapi hos Terje Horpestad i Sandnes.",
};

export default async function BestillTimePage() {
  const [settings, services] = await Promise.all([getSettings(), getServices()]);
  const phoneDisplay = formatPhone(settings.phone);
  const phoneTel = telHref(settings.phone);

  return (
    <div className="py-16 md:py-24">
      <div className="container-wide section-padding mx-auto">
        <div className="mb-10 md:mb-14">
          <p className="text-label mb-3">Timebestilling</p>
          <h1 className="text-heading-display mb-4">Bestill time</h1>
          <p className="text-body-lg max-w-2xl">
            Velg en ledig dato og klokkeslett. Terje bekrefter timen og tar kontakt med deg.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-stone/10 bg-sage-light/30 px-5 py-4">
            <p className="mb-1 font-sans text-xs uppercase tracking-widest text-sage">Ring oss</p>
            <a
              href={`tel:${phoneTel}`}
              className="inline-flex items-center gap-2 font-sans text-stone transition-colors hover:text-sage-dark"
            >
              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {phoneDisplay}
            </a>
          </div>
          <div className="rounded-xl border border-stone/10 bg-cream/60 px-5 py-4">
            <p className="mb-1 font-sans text-xs uppercase tracking-widest text-sage">Avbestilling</p>
            <Link
              href="/avbestill"
              className="font-sans text-sm font-normal text-stone underline-offset-2 hover:text-sage-dark hover:underline"
            >
              Gå til avbestilling
            </Link>
          </div>
        </div>

        <BookingForm services={services.map((item) => ({ value: item.slug, label: item.title }))} />
      </div>
    </div>
  );
}
