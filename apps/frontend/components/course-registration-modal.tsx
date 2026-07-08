"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { Check, MapPin, X } from "lucide-react";

import { FloatingLabelField, FloatingLabelTextarea } from "@/components/floating-label-field";
import { TurnstileWidget } from "@/components/turnstile-widget";
import type { CourseSessionAvailability } from "@/lib/course-registration";

const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());

const floatingFieldClassName =
  "w-full rounded-xl border border-stone/10 bg-cream/40 px-4 pb-2.5 pt-6 font-sans text-base font-normal text-stone transition-colors focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/15";

type CourseRegistrationModalProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly courseSlug: string;
  readonly courseTitle: string;
  readonly sessions: readonly CourseSessionAvailability[];
  readonly price: number | null;
  readonly phoneDisplay: string | null;
  readonly phoneTel: string;
  readonly location: string | null;
  readonly mapsUrl: string | null;
};

function spotsLabel(session: CourseSessionAvailability): string {
  if (session.isFull) return "Venteliste";
  if (session.spotsLeft <= 3) return `${session.spotsLeft} plass${session.spotsLeft === 1 ? "" : "er"} igjen`;
  return `${session.spotsLeft} plasser`;
}

function CourseRegistrationForm({
  courseSlug,
  courseTitle,
  sessions,
  price,
}: Pick<CourseRegistrationModalProps, "courseSlug" | "courseTitle" | "sessions" | "price">) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [sessionLabel, setSessionLabel] = useState(
    () => sessions.find((session) => !session.isFull)?.label ?? sessions[0]?.label ?? "",
  );
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (sessions.length > 0 && !sessionLabel) {
      setErrorMessage("Velg en kursdato.");
      return;
    }

    if (turnstileEnabled && !turnstileToken) {
      setErrorMessage("Bekreft at du ikke er en robot.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const honeypot = new FormData(event.currentTarget).get("website");

    try {
      const response = await fetch("/api/kurs/pamelding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug,
          firstName,
          lastName,
          email,
          phone,
          sessionLabel,
          message,
          website: typeof honeypot === "string" ? honeypot : "",
          ...(turnstileToken ? { turnstileToken } : {}),
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Kunne ikke sende påmeldingen.");
      }

      setSuccessMessage(data.message ?? "Påmeldingen er sendt.");
    } catch (error) {
      setTurnstileToken(null);
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke sende påmeldingen.");
    } finally {
      setSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <div className="py-6 text-center">
        <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-sage-light">
          <Check className="size-7 text-sage-dark" aria-hidden />
        </span>
        <h3 className="mb-2 font-serif text-2xl font-normal text-stone">Takk for påmeldingen!</h3>
        <p className="mx-auto max-w-md font-sans text-base font-normal leading-relaxed text-stone/80">
          {successMessage}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-6 rounded-xl border border-stone/10 bg-cream/40 p-4">
        <p className="font-sans text-xs tracking-widest text-sage uppercase">Kurs</p>
        <p className="mt-1 font-sans text-base font-normal text-stone">{courseTitle}</p>
        {price != null && (
          <p className="mt-1 font-sans text-sm font-normal text-stone/70">
            {price.toLocaleString("nb-NO")} kr
          </p>
        )}
      </div>

      {/* Date picker — radio-style cards with spots left, like the original app */}
      {sessions.length > 0 && (
        <div className="mb-6">
          <fieldset>
            <legend className="mb-4 font-sans text-sm font-normal text-stone">Velg kursdato</legend>
            <ul className="grid gap-3 sm:grid-cols-2">
              {sessions.map((session) => {
                const isSelected = sessionLabel === session.label;
                return (
                  <li key={session.label}>
                    <button
                      type="button"
                      onClick={() => setSessionLabel(session.label)}
                      className={`group relative flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-all md:p-5 ${
                        isSelected
                          ? "bg-sage-light/50 shadow-sm ring-2 ring-sage"
                          : "bg-cream/30 ring-1 ring-stone/10 hover:bg-cream/50 hover:ring-stone/20"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          isSelected
                            ? "border-sage bg-sage text-cream"
                            : "border-stone/25 bg-white group-hover:border-sage/40"
                        }`}
                      >
                        {isSelected && <Check className="size-3" strokeWidth={3} aria-hidden />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-sans text-sm font-normal leading-snug text-stone md:text-base">
                          {session.label}
                        </span>
                        <span
                          className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 font-sans text-xs font-normal ${
                            session.isFull
                              ? "bg-stone/10 text-stone/80"
                              : session.spotsLeft <= 3
                                ? "bg-amber-100/80 text-amber-900"
                                : "bg-white/80 text-stone/80"
                          }`}
                        >
                          {spotsLabel(session)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <FloatingLabelField
          label="Fornavn *"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          fieldClassName={floatingFieldClassName}
          autoComplete="given-name"
          required
        />
        <FloatingLabelField
          label="Etternavn *"
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          fieldClassName={floatingFieldClassName}
          autoComplete="family-name"
          required
        />
        <FloatingLabelField
          label="E-post *"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          fieldClassName={floatingFieldClassName}
          autoComplete="email"
          required
        />
        <FloatingLabelField
          label="Telefon *"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          fieldClassName={floatingFieldClassName}
          autoComplete="tel"
          required
        />
        <FloatingLabelTextarea
          label="Melding (valgfritt)"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          fieldClassName={`${floatingFieldClassName} min-h-28 resize-y`}
          className="sm:col-span-2"
          rows={3}
        />
      </div>

      {/* Honeypot: hidden from humans, bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Nettside
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {turnstileEnabled && (
        <div className="mt-6">
          <TurnstileWidget
            onToken={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            onError={() => {
              setTurnstileToken(null);
              setErrorMessage("Sikkerhetskontrollen kunne ikke lastes. Prøv igjen.");
            }}
          />
        </div>
      )}

      {errorMessage && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 font-sans text-sm font-normal text-red-700">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || (turnstileEnabled && !turnstileToken)}
        className="mt-6 w-full cursor-pointer rounded-full bg-stone px-8 py-4 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sender …" : "Send påmelding"}
      </button>
      <p className="mt-3 text-center font-sans text-xs font-normal text-stone/60">
        Påmeldingen er uforpliktende. Terje bekrefter plassen og avtaler betaling med deg.
      </p>
    </form>
  );
}

export function CourseRegistrationModal({
  open,
  onClose,
  courseSlug,
  courseTitle,
  sessions,
  price,
  phoneDisplay,
  phoneTel,
  location,
  mapsUrl,
}: CourseRegistrationModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        className="absolute inset-0 bg-stone/50 backdrop-blur-[2px]"
        aria-label="Lukk påmelding"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 flex h-full w-full flex-col overflow-hidden bg-white sm:mx-auto sm:my-auto sm:h-auto sm:max-h-[min(90vh,900px)] sm:max-w-3xl sm:rounded-2xl sm:shadow-xl sm:ring-1 sm:ring-stone/10"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-warm-light px-5 py-4 sm:px-8 sm:py-6">
          <div className="min-w-0 pr-2">
            <p className="text-label mb-1">Påmelding</p>
            <h2 id={titleId} className="font-serif text-2xl font-normal text-stone sm:text-3xl">
              Meld deg på kurset
            </h2>
            <p id={descriptionId} className="text-body-sm mt-2">
              Fyll inn opplysningene dine, så tar Terje kontakt for å bekrefte plassen.
            </p>
            {location && mapsUrl && (
              <p className="text-body-sm mt-3">
                <MapPin className="mr-1.5 inline size-4 -translate-y-px text-sage-dark" aria-hidden />
                Kurset holdes på{" "}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone underline-offset-2 transition-colors hover:text-sage-dark hover:underline"
                >
                  {location}
                </a>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-stone/70 transition-colors hover:bg-cream hover:text-stone"
            aria-label="Lukk"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <CourseRegistrationForm
            courseSlug={courseSlug}
            courseTitle={courseTitle}
            sessions={sessions}
            price={price}
          />
        </div>

        {phoneDisplay && (
          <div className="shrink-0 border-t border-warm-light bg-cream/40 px-5 py-4 text-center sm:px-8">
            <p className="font-sans text-xs font-normal tracking-widest text-stone/60 uppercase">
              Spørsmål om påmelding?{" "}
              <a
                href={`tel:${phoneTel}`}
                className="text-stone underline-offset-2 transition-colors hover:text-sage-dark hover:underline"
              >
                Ring {phoneDisplay}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const CourseRegistrationContext = createContext<(() => void) | null>(null);

type CourseRegistrationProviderProps = Omit<CourseRegistrationModalProps, "open" | "onClose"> & {
  readonly children: ReactNode;
};

// Owns the single modal instance; every trigger inside opens the same modal.
export function CourseRegistrationProvider({ children, ...modalProps }: CourseRegistrationProviderProps) {
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  return (
    <CourseRegistrationContext.Provider value={openModal}>
      {children}
      <CourseRegistrationModal {...modalProps} open={open} onClose={closeModal} />
    </CourseRegistrationContext.Provider>
  );
}

export function CourseRegistrationTrigger({ className }: { readonly className?: string }) {
  const openModal = useContext(CourseRegistrationContext);

  return (
    <button
      type="button"
      onClick={openModal ?? undefined}
      className={
        className ??
        "cursor-pointer rounded-full bg-stone px-6 py-3 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage-dark"
      }
    >
      Meld deg på
    </button>
  );
}
