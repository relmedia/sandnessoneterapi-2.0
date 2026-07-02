"use client";

import { Analytics } from "@vercel/analytics/next";

import { useConsentValue } from "@/components/cookie-consent";

export function ConsentAwareAnalytics() {
  const hasAnalyticsConsent = useConsentValue("analytics");

  if (!hasAnalyticsConsent) {
    return null;
  }

  return <Analytics />;
}
