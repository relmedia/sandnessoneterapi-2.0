"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const navLinks = [
  { href: "/kurs", label: "Kurs" },
  { href: "/foredrag", label: "Foredrag" },
  { href: "/boker", label: "Bøker" },
  { href: "/artikler", label: "Artikler" },
  { href: "/om-meg", label: "Om meg" },
  { href: "/priser", label: "Priser" },
] as const;

type NavService = {
  title: string;
  slug: string;
};

const desktopNavItemClass =
  "relative z-10 rounded-full px-3 py-1.5 text-base font-sans font-normal tracking-wide text-stone/90 transition-colors hover:text-stone";

type HoverRect = { left: number; top: number; width: number; height: number };

function BehandlingerDropdown({
  services,
  onItemHover,
}: {
  readonly services: readonly NavService[];
  readonly onItemHover: (element: HTMLElement) => void;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div
      className="relative"
      onMouseEnter={(event) => {
        setOpen(true);
        onItemHover(event.currentTarget);
      }}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`flex items-center gap-1 ${desktopNavItemClass}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        Behandlinger
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <div
        className={`absolute top-full left-0 z-50 pt-3 transition-all duration-200 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <ul
          className="min-w-[220px] overflow-hidden rounded-xl border border-warm-light bg-cream py-2 shadow-lg"
          role="menu"
        >
          {services.map((service) => (
            <li key={service.slug} role="none">
              <Link
                href={`/behandling/${service.slug}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 font-sans text-base font-normal text-stone/90 transition-colors hover:bg-sage-light/60 hover:text-stone"
              >
                {service.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DesktopNav({ services }: { readonly services: readonly NavService[] }) {
  const navRef = useRef<HTMLElement>(null);
  const [hoverRect, setHoverRect] = useState<HoverRect | null>(null);

  const updateHoverRect = useCallback((element: HTMLElement) => {
    const nav = navRef.current;
    if (!nav) return;

    const navBox = nav.getBoundingClientRect();
    const itemBox = element.getBoundingClientRect();

    setHoverRect({
      left: itemBox.left - navBox.left,
      top: itemBox.top - navBox.top,
      width: itemBox.width,
      height: itemBox.height,
    });
  }, []);

  const clearHoverRect = useCallback(() => {
    setHoverRect(null);
  }, []);

  return (
    <nav
      ref={navRef}
      className="relative hidden items-center gap-2 md:flex"
      aria-label="Hovednavigasjon"
      onMouseLeave={clearHoverRect}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute rounded-full bg-sage-light/70 transition-[left,top,width,height,opacity] duration-300 ease-in-out"
        style={{
          opacity: hoverRect ? 1 : 0,
          left: hoverRect?.left ?? 0,
          top: hoverRect?.top ?? 0,
          width: hoverRect?.width ?? 0,
          height: hoverRect?.height ?? 0,
        }}
      />
      <BehandlingerDropdown services={services} onItemHover={updateHoverRect} />
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={desktopNavItemClass}
          onMouseEnter={(event) => updateHoverRect(event.currentTarget)}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function SiteHeader({ services }: { readonly services: readonly NavService[] }) {
  const [open, setOpen] = useState(false);
  const [behandlingerOpen, setBehandlingerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
    setBehandlingerOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-warm-light bg-cream/95 md:bg-cream/90 md:backdrop-blur-sm">
      <div className="container-wide section-padding mx-auto flex h-16 items-center justify-between gap-6">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" onClick={() => setOpen(false)}>
          <Image
            src="/images/logo.png"
            alt=""
            width={250}
            height={259}
            className="h-10 w-auto shrink-0"
            priority
          />
          <div className="flex flex-col leading-none">
            <span className="font-serif text-xl font-normal tracking-tight text-stone transition-colors group-hover:text-sage-dark">
              Sandnes Soneterapi
            </span>
            <span className="font-sans text-[11px] font-normal tracking-[0.2em] text-stone/80 uppercase">
              Terje Horpestad
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-8">
          <DesktopNav services={services} />

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex shrink-0 flex-col gap-1.5 p-1 md:hidden"
            aria-label={open ? "Lukk meny" : "Åpne meny"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            <span className={`block h-px w-6 bg-stone transition-all duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-px w-6 bg-stone transition-all duration-300 ${open ? "opacity-0" : ""}`} />
            <span className={`block h-px w-6 bg-stone transition-all duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out md:hidden ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <nav
            id="mobile-nav"
            className={`flex flex-col gap-4 border-t border-warm-light bg-cream px-6 py-4 transition-opacity duration-300 ${
              open ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-label="Mobilnavigasjon"
            aria-hidden={!open}
          >
            <div className="border-b border-warm-light pb-4">
              <button
                type="button"
                onClick={() => setBehandlingerOpen((prev) => !prev)}
                className="flex w-full items-center justify-between py-1 font-sans text-base font-normal text-stone"
                aria-expanded={behandlingerOpen}
              >
                Behandlinger
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${behandlingerOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                  behandlingerOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="mt-2 flex flex-col gap-2 pl-3">
                    {services.map((service) => (
                      <Link
                        key={service.slug}
                        href={`/behandling/${service.slug}`}
                        onClick={() => {
                          setOpen(false);
                          setBehandlingerOpen(false);
                        }}
                        className="py-1 font-sans text-base font-normal text-stone/90 transition-colors hover:text-stone"
                      >
                        {service.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-warm-light py-1 font-sans text-base font-normal text-stone last:border-0"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/bestill-time"
              onClick={() => setOpen(false)}
              className="rounded-full bg-stone px-5 py-3 text-center font-sans text-sm font-normal tracking-wide text-cream"
            >
              Bestill time
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
