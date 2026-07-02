import Link from "next/link";

import { CourseCard } from "@/components/course-card";
import { ServiceCard } from "@/components/service-card";
import { getCourses, getServices, getSettings } from "@/lib/content";

export const revalidate = 60;

const TERJE_PHOTO_URL =
  "https://ufthnusyaqrmgielobtw.supabase.co/storage/v1/object/public/media/site/terje-horpestad.png";

function formatPhone(phone: string | null) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  return phone;
}

function telHref(phone: string | null) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("47") ? `+${digits}` : `+47${digits}`;
}

// The numeric stat chips are not part of the content schema, so they stay static.
const stats = [
  { value: "40+", label: "Års daglig erfaring" },
  { value: "20+", label: "År som utdanner" },
  { value: "NNH", label: "Godkjent terapeut" },
];

export default async function HomePage() {
  const [settings, services, courses] = await Promise.all([
    getSettings(),
    getServices(),
    getCourses(),
  ]);

  const phoneDisplay = formatPhone(settings.phone);
  const upcomingCourses = courses.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-warm-light opacity-40 blur-2xl"
        />

        <div className="container-wide section-padding relative mx-auto py-24 md:py-36">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-14 *:min-w-0">
            {settings.nnh && (
              <p className="text-label lg:col-start-1 lg:row-start-1">
                Godkjent av NNH – Norske Naturterapeuters Hovedorganisasjon
              </p>
            )}
            <h1 className="text-heading-display leading-tight whitespace-pre-line lg:col-start-1 lg:row-start-2">
              {settings.hero_heading}
            </h1>
            <p className="text-readable max-w-lg text-lg md:text-xl lg:col-start-1 lg:row-start-3">
              {settings.hero_body}
            </p>

            <div className="relative z-10 mx-auto w-[180px] shrink-0 sm:w-[200px] lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:mx-0 lg:w-[220px] lg:self-center xl:w-[240px]">
              <img src={TERJE_PHOTO_URL} alt="Terje Horpestad, soneterapeut" className="h-auto w-full" />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,var(--color-cream)),linear-gradient(to_right,transparent_60%,var(--color-cream))]"
              />
            </div>

            <div className="flex flex-row flex-nowrap items-center gap-2 sm:gap-4 lg:col-start-1 lg:row-start-4">
              <Link
                href="/bestill-time"
                className="shrink-0 rounded-full bg-stone px-4 py-3 font-sans text-xs font-normal tracking-wide whitespace-nowrap text-cream transition-colors hover:bg-sage-dark sm:px-8 sm:py-4 sm:text-sm"
              >
                Bestill time
              </Link>
              <a
                href="#behandlinger"
                className="shrink-0 rounded-full border border-stone/30 px-4 py-3 font-sans text-xs font-normal tracking-wide whitespace-nowrap text-stone transition-colors hover:border-sage hover:text-sage-dark sm:px-8 sm:py-4 sm:text-sm"
              >
                Les mer om behandlinger
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-linear-to-r from-transparent via-warm/30 to-transparent" />

      {/* Behandlinger */}
      <section id="behandlinger" className="scroll-mt-20 bg-linear-to-b from-cream to-warm-light/40 py-20 md:py-28">
        <div className="container-wide section-padding mx-auto">
          <div className="mb-14 max-w-2xl">
            <p className="text-label mb-3">Behandlinger</p>
            <h2 className="text-heading-hero">Hva kan jeg hjelpe deg med?</h2>
            <p className="text-readable mt-4 text-stone/90">
              Skånsomme, erfaringsbaserte metoder tilpasset dine behov — enten du søker avspenning, balanse
              eller støtte i en utfordrende periode.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                title={service.title}
                slug={service.slug}
                description={service.short_description}
                imageUrl={service.image_url}
                imageAlt={service.image_alt}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Om terapeuten */}
      <section id="om" className="scroll-mt-20 bg-warm-light py-20 md:py-28">
        <div className="container-wide section-padding mx-auto grid items-center gap-16 md:grid-cols-2">
          <div>
            <p className="text-label mb-4">Om terapeuten</p>
            <h2 className="text-heading-hero mb-6">40 år med daglig erfaring</h2>
            <div className="text-readable space-y-4 text-stone/90">
              <p>
                Terje Horpestad har over 40 års daglig erfaring innen soneterapi og alternativ medisin. Han
                er godkjent av Norske Naturterapeuters Hovedorganisasjon (NNH) og har utdannet terapeuter
                gjennom Soneterapiskolen i over 20 år.
              </p>
              <p>
                Han har skrevet to bøker om soneterapi og et hefte om tankefeltterapi og meridianlære, og
                holder foredrag om soneterapi, helse og kroppen i bevegelse.
              </p>
            </div>
            <Link
              href="/om-meg"
              className="mt-8 inline-block rounded-full border border-stone/40 px-6 py-3 font-sans text-sm font-normal tracking-wide text-stone transition-colors hover:bg-stone hover:text-cream"
            >
              Mer om Terje →
            </Link>
          </div>
          <div className="flex flex-col gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-6 rounded-2xl bg-cream p-6">
                <span className="font-serif text-4xl font-normal text-sage-dark">{stat.value}</span>
                <span className="font-sans text-base font-normal text-stone/90">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kurs */}
      {upcomingCourses.length > 0 && (
        <section id="kurs" className="scroll-mt-20 py-20 md:py-28">
          <div className="container-wide section-padding mx-auto">
            <div className="mb-14 flex items-end justify-between">
              <div>
                <p className="text-label mb-3">Kommende kurs</p>
                <h2 className="text-heading-hero">Kurs og utdanning</h2>
              </div>
              <Link
                href="/kurs"
                className="text-body-sm hidden font-sans transition-colors hover:text-stone md:block"
              >
                Se alle kurs →
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3 md:gap-8">
              {upcomingCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section id="kontakt" className="scroll-mt-20 bg-sage pt-20 md:pt-28">
        <div className="container-wide section-padding mx-auto pb-16 text-center md:pb-20">
          <h2 className="text-heading-display mb-6 text-cream">Klar for en behandling?</h2>
          <p className="mx-auto mb-10 max-w-md font-sans text-lg font-normal text-cream/95">
            Bestill time online eller ring for å avtale.
            {settings.address ? ` Velkommen til ${settings.address}.` : ""}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/bestill-time"
              className="inline-block rounded-full bg-cream px-10 py-5 font-sans text-lg font-normal tracking-wide text-stone transition-colors hover:bg-warm-light"
            >
              Bestill time
            </Link>
            {phoneDisplay && (
              <a
                href={`tel:${telHref(settings.phone)}`}
                className="inline-block rounded-full border border-cream/40 px-10 py-5 font-sans text-lg font-normal tracking-wide text-cream transition-colors hover:bg-cream/10"
              >
                Ring {phoneDisplay}
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
