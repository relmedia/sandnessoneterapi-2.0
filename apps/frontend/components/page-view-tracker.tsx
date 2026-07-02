"use client";

import { useEffect, useRef } from "react";

import { usePathname } from "next/navigation";

import { useConsentValue } from "@/components/cookie-consent";

const SESSION_KEY = "st-session-id";

function getSessionId(): string | null {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// First-party pageview tracking stored in Supabase. Only active with
// analytics consent; sends no cookies and no personal data.
export function PageViewTracker() {
  const hasConsent = useConsentValue("analytics");
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!hasConsent || !pathname || lastTracked.current === pathname) return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    lastTracked.current = pathname;

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        path: pathname,
        // Only meaningful on the landing view; internal referrers are
        // discarded server-side anyway.
        referrer: document.referrer || null,
        sessionId,
      }),
    }).catch(() => {
      // Tracking must never break the page.
    });
  }, [hasConsent, pathname]);

  return null;
}
