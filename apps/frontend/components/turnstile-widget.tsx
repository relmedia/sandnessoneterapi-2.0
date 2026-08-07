"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Lets Cloudflare attribute this integration in account-level analytics.
const TURNSTILE_ACTION = "turnstile-spin-v2";

type TurnstileWidgetProps = {
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
};

export type TurnstileWidgetHandle = {
  /** Discards the redeemed token and issues a challenge for a fresh one. */
  reset: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          action?: string;
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed to load.")), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed to load."));
    document.head.appendChild(script);
  });
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(function TurnstileWidget(
  { onToken, onExpire, onError },
  ref,
) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Turnstile tokens are single-use: once siteverify redeems one, submitting it
  // again is rejected as timeout-or-duplicate. Forms call this before letting
  // the visitor retry so the next attempt carries a fresh token.
  useImperativeHandle(
    ref,
    () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }),
    [],
  );

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "light",
          action: TURNSTILE_ACTION,
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onExpireRef.current?.(),
          "error-callback": () => onErrorRef.current?.(),
        });
      })
      .catch(() => {
        onErrorRef.current?.();
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <div
      ref={containerRef}
      className="cf-turnstile min-h-[65px]"
      data-sitekey={siteKey}
      data-action={TURNSTILE_ACTION}
      aria-label="Sikkerhetskontroll"
    />
  );
});
