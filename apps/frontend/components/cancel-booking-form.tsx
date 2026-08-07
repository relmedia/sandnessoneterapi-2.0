"use client";

import { useEffect, useId, useRef, useState } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { nb } from "react-day-picker/locale";

import { FloatingLabelField } from "@/components/floating-label-field";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget";
import { formatDateIso, formatDateNbLong } from "@/lib/booking";

import "react-day-picker/style.css";
import "./booking-calendar.css";

type Step = "form" | "confirm" | "success" | "error";

const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());

interface BookingPreview {
  service?: string;
  date?: string;
  time?: string;
  status?: string;
  canCancel?: boolean;
}

function DateField({
  label,
  value,
  onChange,
  required,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly required?: boolean;
}) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const defaultClassNames = getDefaultClassNames();

  const parsed = value ? new Date(`${value}T12:00:00`) : null;
  const selectedDate = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
  const floated = open || Boolean(value);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          required={required}
          readOnly
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-px w-px opacity-0"
          onChange={() => {}}
        />
        <button
          type="button"
          id={id}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={`flex w-full items-center rounded-xl border bg-cream px-4 pb-2.5 pt-6 text-left font-sans text-base font-normal transition-colors focus:border-sage focus:outline-none ${
            open ? "border-sage" : "border-warm-light"
          }`}
        >
          <span className={value ? "text-stone" : "select-none text-transparent"}>
            {selectedDate ? formatDateNbLong(formatDateIso(selectedDate)) : "Velg dato"}
          </span>
          <svg
            className="ml-auto size-4 shrink-0 text-sage-dark"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M8 2v4M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
          </svg>
        </button>
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-4 origin-left transition-all duration-200 ease-out ${
            floated
              ? "top-2.5 translate-y-0 text-xs font-normal text-sage"
              : "top-1/2 -translate-y-1/2 text-sm font-normal text-stone/70"
          }`}
        >
          {label}
        </label>

        {open && (
          <div
            role="dialog"
            aria-label={label}
            className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-warm-light bg-cream p-3 shadow-lg"
          >
            <div className="booking-calendar w-full">
              <DayPicker
                mode="single"
                locale={nb}
                weekStartsOn={1}
                selected={selectedDate}
                onSelect={(date) => {
                  if (!date) return;
                  onChange(formatDateIso(date));
                  setOpen(false);
                }}
                classNames={{
                  ...defaultClassNames,
                  root: `${defaultClassNames.root} mx-auto font-sans`,
                  month_caption: `${defaultClassNames.month_caption} mb-3 font-serif text-lg font-normal text-stone`,
                  weekday: `${defaultClassNames.weekday} text-stone/80 text-[0.7rem] uppercase tracking-wider font-normal`,
                  day: `${defaultClassNames.day} rounded-full`,
                  day_button: `${defaultClassNames.day_button} text-stone hover:bg-sage-light/60 transition-colors`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CancelBookingForm() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";

  const [step, setStep] = useState<Step>(initialToken ? "confirm" : "form");
  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [booking, setBooking] = useState<BookingPreview | null>(null);
  const [loading, setLoading] = useState(Boolean(initialToken));
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useLookup, setUseLookup] = useState(false);

  // The lookup step and the confirm step each hit a protected endpoint, and a
  // Turnstile token can only be redeemed once, so each step gets its own widget.
  const [lookupCaptcha, setLookupCaptcha] = useState<string | null>(null);
  const [cancelCaptcha, setCancelCaptcha] = useState<string | null>(null);
  const lookupCaptchaRef = useRef<TurnstileWidgetHandle>(null);
  const cancelCaptchaRef = useRef<TurnstileWidgetHandle>(null);

  useEffect(() => {
    if (!initialToken) return;
    void loadBookingByToken(initialToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  async function loadBookingByToken(cancelToken: string) {
    setLoading(true);
    setErrorMessage(null);
    setUseLookup(false);

    try {
      const response = await fetch(`/api/booking/cancel?token=${encodeURIComponent(cancelToken)}`);
      const data = (await response.json()) as { booking?: BookingPreview; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Fant ikke timen.");
      }

      setBooking(data.booking ?? null);
      setToken(cancelToken);
      setStep("confirm");
    } catch (error) {
      setStep("error");
      setErrorMessage(error instanceof Error ? error.message : "Fant ikke timen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLookupSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (turnstileEnabled && !lookupCaptcha) {
      setErrorMessage("Bekreft at du ikke er en robot.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setUseLookup(true);

    try {
      const response = await fetch("/api/booking/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          date,
          website: "",
          ...(lookupCaptcha ? { turnstileToken: lookupCaptcha } : {}),
        }),
      });

      const data = (await response.json()) as { booking?: BookingPreview; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Fant ingen time.");
      }

      setLookupCaptcha(null);
      setBooking(data.booking ?? null);
      setStep("confirm");
    } catch (error) {
      setLookupCaptcha(null);
      lookupCaptchaRef.current?.reset();
      setErrorMessage(error instanceof Error ? error.message : "Fant ingen time.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (turnstileEnabled && !cancelCaptcha) {
      setErrorMessage("Bekreft at du ikke er en robot.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const lookupBody =
        !useLookup && token.trim() ? { token: token.trim(), website: "" } : { email, phone, date, website: "" };

      const response = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lookupBody,
          ...(cancelCaptcha ? { turnstileToken: cancelCaptcha } : {}),
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string; booking?: BookingPreview };

      if (!response.ok) {
        throw new Error(data.error ?? "Kunne ikke avbestille.");
      }

      setCancelCaptcha(null);
      setBooking(data.booking ?? null);
      setStep("success");
    } catch (error) {
      setCancelCaptcha(null);
      cancelCaptchaRef.current?.reset();
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke avbestille.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-body-sm">Henter time …</p>;
  }

  if (step === "success") {
    return (
      <div className="max-w-xl rounded-2xl border border-sage/30 bg-sage-light/40 p-10 text-center">
        <p className="text-heading-page mb-4">Timen er avbestilt</p>
        <p className="text-body-sm mb-6">Avbestillingen er registrert. Ta kontakt om du ønsker en ny time.</p>
        <Link
          href="/bestill-time"
          className="inline-block rounded-full bg-sage px-8 py-4 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage-dark"
        >
          Bestill ny time
        </Link>
      </div>
    );
  }

  if (step === "confirm" && booking) {
    return (
      <div className="max-w-xl space-y-6">
        <div className="rounded-2xl border border-warm-light bg-cream p-8">
          <h2 className="text-heading-card mb-4">Bekreft avbestilling</h2>
          <dl className="text-body-sm space-y-3">
            {booking.service && (
              <div>
                <dt className="text-xs uppercase tracking-widest text-sage">Behandling</dt>
                <dd className="text-stone">{booking.service}</dd>
              </div>
            )}
            {booking.date && (
              <div>
                <dt className="text-xs uppercase tracking-widest text-sage">Dato</dt>
                <dd className="text-stone">{formatDateNbLong(booking.date)}</dd>
              </div>
            )}
            {booking.time && (
              <div>
                <dt className="text-xs uppercase tracking-widest text-sage">Klokkeslett</dt>
                <dd className="text-stone">{booking.time}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="flex flex-col items-start gap-4">
          {!booking.canCancel && booking.status === "cancelled" ? (
            <p className="text-body-sm">Denne timen er allerede avbestilt.</p>
          ) : !booking.canCancel ? (
            <p className="text-body-sm">Timen kan ikke avbestilles online. Ring oss for hjelp.</p>
          ) : (
            <>
              {turnstileEnabled && (
                <TurnstileWidget
                  ref={cancelCaptchaRef}
                  onToken={setCancelCaptcha}
                  onExpire={() => setCancelCaptcha(null)}
                  onError={() => {
                    setCancelCaptcha(null);
                    setErrorMessage("Sikkerhetskontrollen kunne ikke lastes. Prøv igjen.");
                  }}
                />
              )}
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={submitting || (turnstileEnabled && !cancelCaptcha)}
                className="rounded-full bg-stone px-8 py-4 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage-dark disabled:opacity-50"
              >
                {submitting ? "Avbestiller …" : "Avbestill timen"}
              </button>
            </>
          )}

          {errorMessage && (
            <p className="font-sans text-sm text-red-700" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setStep("form");
              setBooking(null);
              setErrorMessage(null);
              setCancelCaptcha(null);
            }}
            className="font-sans text-sm font-normal text-sage-dark underline underline-offset-2"
          >
            Tilbake
          </button>
        </div>
      </div>
    );
  }

  if (step === "error" && initialToken) {
    return (
      <div className="max-w-xl space-y-6">
        <p className="text-body-sm">{errorMessage ?? "Fant ikke timen."}</p>
        <button
          type="button"
          onClick={() => {
            setStep("form");
            setErrorMessage(null);
            setToken("");
          }}
          className="font-sans text-sm font-normal text-sage-dark underline underline-offset-2"
        >
          Prøv på en annen måte
        </button>
      </div>
    );
  }

  return (
    <div className="grid max-w-4xl gap-12 lg:grid-cols-2">
      <section>
        <h2 className="text-heading-card mb-4">Har du avbestillingskode?</h2>
        <p className="text-body-sm mb-6 leading-relaxed">
          Koden vises etter du har bestilt time. Lim den inn her, eller bruk lenken fra bekreftelsen.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void loadBookingByToken(token.trim());
          }}
          className="space-y-4"
        >
          <FloatingLabelField
            label="Avbestillingskode"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <button
            type="submit"
            disabled={!token.trim() || submitting}
            className="rounded-full bg-sage px-6 py-3 font-sans text-sm font-normal text-cream transition-colors hover:bg-sage-dark disabled:opacity-50"
          >
            Finn time
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-heading-card mb-4">Eller bruk e-post og dato</h2>
        <p className="text-body-sm mb-6 leading-relaxed">Oppgi samme e-post, telefon og dato som ved bestilling.</p>
        <form onSubmit={handleLookupSubmit} className="space-y-4">
          <FloatingLabelField
            label="E-post"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FloatingLabelField
            label="Telefon"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <DateField label="Dato for timen" required value={date} onChange={setDate} />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          {turnstileEnabled && (
            <TurnstileWidget
              ref={lookupCaptchaRef}
              onToken={setLookupCaptcha}
              onExpire={() => setLookupCaptcha(null)}
              onError={() => {
                setLookupCaptcha(null);
                setErrorMessage("Sikkerhetskontrollen kunne ikke lastes. Prøv igjen.");
              }}
            />
          )}
          <button
            type="submit"
            disabled={submitting || (turnstileEnabled && !lookupCaptcha)}
            className="rounded-full border border-stone/30 px-6 py-3 font-sans text-sm font-normal text-stone transition-colors hover:border-sage hover:text-sage-dark disabled:opacity-50"
          >
            {submitting ? "Søker …" : "Finn time"}
          </button>
        </form>
      </section>

      {errorMessage && step === "form" && (
        <p className="font-sans text-sm text-red-700 lg:col-span-2" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
