import Link from "next/link";

import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";

import { FooterCookieLink } from "@/components/footer-cookie-link";
import { getSettings } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";

const footerPageLinks = [
  ["/kurs", "Kurs"],
  ["/foredrag", "Foredrag"],
  ["/boker", "Bøker"],
  ["/artikler", "Artikler"],
  ["/om-meg", "Om meg"],
  ["/priser", "Priser"],
] as const;

const footerBookingLinks = [
  ["/bestill-time", "Bestill time"],
  ["/avbestill", "Avbestill time"],
] as const;

const legalLinks = [
  ["/salgsvilkar", "Salgsvilkår"],
  ["/personvern", "Personvern"],
] as const;

const DEFAULT_FACEBOOK_URL = "https://www.facebook.com/p/Sandnes-Soneterapi-100057511755279/";

function getGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

function isSafeExternalUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.437H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.437C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export async function SiteFooter() {
  const settings = await getSettings();
  const year = new Date().getFullYear();
  const phoneDisplay = formatPhone(settings.phone);
  const phoneTel = telHref(settings.phone);
  const facebookUrl =
    settings.facebook_url && isSafeExternalUrl(settings.facebook_url)
      ? settings.facebook_url
      : DEFAULT_FACEBOOK_URL;

  return (
    <footer className="bg-stone text-cream/80">
      <div className="container-wide section-padding mx-auto grid gap-y-12 py-16 md:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,1fr)] md:gap-x-12 lg:gap-x-16">
        <div>
          <h3 className="mb-3 font-serif text-2xl font-normal text-cream">{settings.title ?? "Sandnes Soneterapi"}</h3>
          <p className="font-sans text-sm font-normal leading-relaxed text-cream/60">
            Terje Horpestad – godkjent soneterapeut med over 40 års erfaring.
          </p>
          {settings.nnh && (
            <p className="mt-4 font-sans text-xs tracking-widest text-warm uppercase">NNH-godkjent</p>
          )}
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Følg oss på Facebook"
            className="group mt-5 inline-flex w-full max-w-xs items-center gap-3.5 rounded-xl border border-cream/10 bg-cream/4 px-4 py-3.5 transition-all duration-200 hover:border-cream/20 hover:bg-cream/8"
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#1877F2] text-white shadow-sm ring-1 ring-white/10">
              <FacebookIcon className="size-4" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block font-sans text-[11px] font-normal tracking-[0.14em] text-cream/45 uppercase">
                Facebook
              </span>
              <span className="mt-0.5 block font-sans text-sm font-normal leading-snug text-cream/90 transition-colors group-hover:text-cream">
                Følg oss på Facebook
              </span>
            </span>
            <ArrowUpRight
              className="size-4 shrink-0 text-cream/35 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-cream/70"
              aria-hidden="true"
            />
          </a>
        </div>

        <div className="md:pl-6 lg:pl-10 xl:pl-14">
          <nav className="grid grid-cols-2 gap-x-8 sm:gap-x-10" aria-label="Bunnnavigasjon">
            <div>
              <h4 className="mb-4 font-sans text-xs tracking-widest text-warm uppercase">Sider</h4>
              <ul className="flex flex-col gap-2">
                {footerPageLinks.map(([href, label]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="font-sans text-sm font-normal text-cream/90 transition-colors hover:text-cream"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-sans text-xs tracking-widest text-warm uppercase">Bestilling</h4>
              <ul className="flex flex-col gap-2">
                {footerBookingLinks.map(([href, label]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="font-sans text-sm font-normal text-cream/90 transition-colors hover:text-cream"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <div className="md:justify-self-end md:pl-8 lg:pl-12 xl:pl-16">
          <h4 className="mb-4 font-sans text-xs tracking-widest text-warm uppercase">Kontakt</h4>
          <div className="flex flex-col gap-2 font-sans text-sm font-normal text-cream/90">
            {settings.phone && (
              <a href={`tel:${phoneTel}`} className="inline-flex items-center gap-2 transition-colors hover:text-cream">
                <Phone className="size-4 shrink-0" aria-hidden="true" />
                {phoneDisplay}
              </a>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="inline-flex items-center gap-2 transition-colors hover:text-cream"
              >
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                {settings.email}
              </a>
            )}
            {settings.address && (
              <a
                href={getGoogleMapsUrl(settings.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors hover:text-cream"
              >
                <MapPin className="size-4 shrink-0" aria-hidden="true" />
                {settings.address}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-cream/10 py-6">
        <div className="container-wide section-padding mx-auto flex flex-col items-center gap-4 text-center font-sans text-xs font-normal text-cream/55 sm:flex-row sm:justify-between sm:text-left">
          <p>© {year} Sandnes Soneterapi · Terje Horpestad</p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-8">
            <nav
              className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 sm:gap-x-10"
              aria-label="Juridisk"
            >
              {legalLinks.map(([href, label]) => (
                <Link key={href} href={href} className="text-cream/50 transition-colors hover:text-cream/80">
                  {label}
                </Link>
              ))}
              <FooterCookieLink />
            </nav>
            <p className="text-cream/50">
              Nettside av{" "}
              <a
                href="https://relmedia.no"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cream/70 transition-colors hover:text-cream"
              >
                relmedia.no
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
