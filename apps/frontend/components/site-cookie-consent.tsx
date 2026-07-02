"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Settings } from "lucide-react";

import {
  CookieConsentProvider,
  CookieSettings,
  useCookieConsent,
  type CategoryConfig,
} from "@/components/cookie-consent";
import { ConsentAwareAnalytics } from "@/components/consent-aware-analytics";
import { PageViewTracker } from "@/components/page-view-tracker";
import { cn } from "@/lib/utils";

const CONSENT_VERSION = "1.0.0";

const categories: CategoryConfig[] = [
  {
    key: "necessary",
    title: "Nødvendige",
    description:
      "Essensielle informasjonskapsler for drift av nettsiden, skjema, bestilling og lagring av cookie-valg. Kan ikke slås av.",
    required: true,
  },
  {
    key: "analytics",
    title: "Statistikk",
    description:
      "Anonymisert besøksstatistikk som hjelper oss å forstå hvordan nettsiden brukes (Vercel Analytics).",
  },
  {
    key: "marketing",
    title: "Markedsføring",
    description: "Vi bruker for tiden ikke markedsføringsverktøy. Dette valget gjelder ved eventuell fremtidig bruk.",
  },
  {
    key: "preferences",
    title: "Preferanser",
    description: "Informasjonskapsler som husker dine valg og innstillinger på nettsiden.",
  },
];

function SiteCookieBanner() {
  const { isBannerVisible, isSettingsOpen, acceptAll, rejectAll, openSettings } = useCookieConsent();

  return (
    <AnimatePresence>
      {isBannerVisible && !isSettingsOpen && (
        <motion.div
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-description"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-stone/10 bg-stone/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur-sm sm:p-6"
        >
          <div className="container-wide section-padding mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0 sm:flex-1">
              <p
                id="cookie-consent-title"
                className="mb-2 font-sans text-sm font-medium tracking-wide text-cream"
              >
                Informasjonskapsler
              </p>
              <p
                id="cookie-consent-description"
                className="font-sans text-sm font-normal leading-relaxed text-cream/75"
              >
                Vi bruker nødvendige informasjonskapsler for drift av nettsiden, skjema og bestilling. Med
                «Godta alle» samtykker du også til anonymisert besøksstatistikk. Les mer i{" "}
                <Link href="/personvern" className="text-cream underline underline-offset-2">
                  personvernerklæringen
                </Link>
                .
              </p>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <button
                type="button"
                onClick={openSettings}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full border border-cream/25 px-4 py-3 font-sans text-sm font-normal text-cream/90 transition-colors hover:border-cream/50 hover:text-cream sm:px-5 sm:py-2.5",
                )}
              >
                <Settings className="size-4" aria-hidden="true" />
                Tilpass
              </button>
              <button
                type="button"
                onClick={() => void rejectAll()}
                className="rounded-full border border-cream/25 px-4 py-3 font-sans text-sm font-normal text-cream/90 transition-colors hover:border-cream/50 hover:text-cream sm:px-5 sm:py-2.5"
              >
                Kun nødvendige
              </button>
              <button
                type="button"
                onClick={() => void acceptAll()}
                className="rounded-full bg-cream px-4 py-3 font-sans text-sm font-normal text-stone transition-colors hover:bg-warm-light sm:px-5 sm:py-2.5"
              >
                Godta alle
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function SiteCookieConsent({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider
      config={{
        consentVersion: CONSENT_VERSION,
        expirationDays: 365,
        privacyPolicyUrl: "/personvern",
        position: "bottom",
        categories,
      }}
    >
      {children}
      <SiteCookieBanner />
      <CookieSettings />
      <ConsentAwareAnalytics />
      <PageViewTracker />
    </CookieConsentProvider>
  );
}
