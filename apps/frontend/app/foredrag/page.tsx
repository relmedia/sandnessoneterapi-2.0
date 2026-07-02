import type { Metadata } from "next";
import Link from "next/link";

import { Mail, Phone } from "lucide-react";

import { getPage, getSettings } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Foredrag",
  description:
    "Terje Horpestad holder foredrag om soneterapi, helse og kroppen i bevegelse. Bestill foredrag for bedrifter, foreninger og kurs.",
};

export default async function ForedragPage() {
  const [page, settings] = await Promise.all([getPage("foredrag"), getSettings()]);
  const phoneDisplay = formatPhone(settings.phone);
  const phoneTel = telHref(settings.phone);
  const pageTitle = page?.title ?? "Foredrag";

  return (
    <article>
      <section className="relative overflow-hidden border-b border-warm-light/80 bg-cream">
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-warm-light/50 blur-3xl"
        />

        <div className="container-wide section-padding relative mx-auto py-12 md:py-16 lg:py-20">
          <nav
            className="text-caption mb-10 flex items-center gap-2 tracking-widest uppercase md:mb-12"
            aria-label="Brødsmulesti"
          >
            <Link href="/" className="transition-colors hover:text-stone">
              Forside
            </Link>
            <span aria-hidden>/</span>
            <span className="text-stone">Foredrag</span>
          </nav>

          <div className="max-w-2xl">
            <p className="text-label mb-5">Formidling</p>
            <h1 className="text-heading-hero leading-[1.12] md:text-[clamp(2.25rem,4vw,3.5rem)]">{pageTitle}</h1>
            <p className="text-body-lg mt-6 max-w-lg md:text-lg">
              Inspirerende og praktiske foredrag om soneterapi og helse — tilpasset bedrifter, foreninger
              og fagmiljøer.
            </p>
            <a
              href="#bestill-foredrag"
              className="mt-8 inline-flex items-center rounded-full bg-stone px-7 py-3.5 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage-dark"
            >
              Kontakt for foredrag
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-wide section-padding mx-auto">
          {page?.body ? (
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: page.body }} />
          ) : (
            <div className="prose-content">
              <p>
                Terje Horpestad holder foredrag om soneterapi, helse og kroppen i bevegelse. Med over 40
                års daglig erfaring formidler han hvordan kroppen kan forstås og støttes gjennom soneterapi
                og naturlige helsemetoder.
              </p>
              <p>
                Foredragene passer for bedrifter, foreninger, skoler og fagmiljøer som ønsker inspirasjon
                og praktisk kunnskap om kroppens signaler, avspenning og egenomsorg.
              </p>
              <h2>Typiske temaer</h2>
              <ul>
                <li>Introduksjon til soneterapi og sonekartet</li>
                <li>Kroppen i bevegelse – helse, stress og balanse</li>
                <li>Praktiske tips for avspenning og egenbehandling</li>
                <li>Soneterapi i arbeidslivet og bedriftshelse</li>
              </ul>
              <p>Innhold og lengde tilpasses etter ønske. Ta kontakt for tilbud, tilgjengelighet og priser.</p>
            </div>
          )}

          <div id="bestill-foredrag" className="mt-16 overflow-hidden rounded-2xl bg-stone">
            <div className="flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-10">
              <div>
                <h2 className="font-serif text-2xl font-normal text-cream md:text-3xl">Bestill foredrag</h2>
                <p className="mt-2 max-w-md font-sans text-sm font-normal leading-relaxed text-cream/75 md:text-base">
                  Ta kontakt for tilbud, tilgjengelighet og praktisk gjennomføring. Terje tilpasser innhold
                  og lengde etter deres behov.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {phoneDisplay && (
                  <a
                    href={`tel:${phoneTel}`}
                    className="inline-flex items-center gap-2 rounded-full bg-cream px-6 py-3 font-sans text-sm font-normal tracking-wide text-stone transition-colors hover:bg-warm-light"
                  >
                    <Phone className="size-4 shrink-0" aria-hidden />
                    {phoneDisplay}
                  </a>
                )}
                {settings.email && (
                  <a
                    href={`mailto:${settings.email}?subject=${encodeURIComponent("Forespørsel om foredrag")}`}
                    className="inline-flex items-center gap-2 rounded-full border border-cream/30 px-6 py-3 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-cream/10"
                  >
                    <Mail className="size-4 shrink-0" aria-hidden />
                    Send e-post
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
