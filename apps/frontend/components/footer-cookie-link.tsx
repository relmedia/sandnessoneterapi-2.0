"use client";

import { CookieTrigger } from "@/components/cookie-consent";

export function FooterCookieLink() {
  return (
    <CookieTrigger
      variant="text"
      className="text-cream/50 transition-colors hover:text-cream/80 no-underline hover:underline"
    />
  );
}
