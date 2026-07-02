"use client";

import { useEffect, useState } from "react";

import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { nb } from "react-day-picker/locale";

import {
  FloatingLabelField,
  FloatingLabelSelect,
  FloatingLabelTextarea,
} from "@/components/floating-label-field";
import {
  formatDateIso,
  getDefaultAvailabilityRange,
  type BookingServiceOption,
} from "@/lib/booking";

import "react-day-picker/style.css";
import "./booking-calendar.css";

type FormState = "idle" | "submitting" | "error";

const floatingFieldClassName =
  "w-full rounded-xl border border-stone/10 bg-cream/40 px-4 pb-2.5 pt-6 font-sans text-base font-normal text-stone transition-colors focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/15";

const panelClassName = "rounded-xl border border-stone/10 bg-cream/30 p-3 sm:p-4";

function CalendarIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v4M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  );
}

function ClockIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UserIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CheckIcon({ className }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

const steps = [
  { id: 1, label: "Dato", Icon: CalendarIcon },
  { id: 2, label: "Tid", Icon: ClockIcon },
  { id: 3, label: "Opplysninger", Icon: UserIcon },
] as const;

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDayLabel(dateIso: string): string {
  const parsed = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateIso;
  return parsed.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long" });
}

export function BookingForm({ services }: { readonly services: readonly BookingServiceOption[] }) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState<string>(services[0]?.value ?? "");
  const [message, setMessage] = useState("");
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [availabilityLoading, setAvailabilityLoading] = useState(true);

  const defaultClassNames = getDefaultClassNames();
  const selectedDateIso = selectedDate ? formatDateIso(selectedDate) : null;

  const activeStep = !selectedDate ? 1 : !selectedTime ? 2 : 3;

  useEffect(() => {
    const { from, to } = getDefaultAvailabilityRange();

    async function loadAvailability() {
      setAvailabilityLoading(true);

      try {
        const response = await fetch(`/api/booking/availability?from=${from}&to=${to}`);
        const data = (await response.json()) as { dates?: string[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Kunne ikke hente ledige dager.");
        }

        setAvailableDates(new Set(data.dates ?? []));
      } catch (error) {
        setAvailableDates(new Set());
        setErrorMessage(error instanceof Error ? error.message : "Kunne ikke hente ledige dager.");
      } finally {
        setAvailabilityLoading(false);
      }
    }

    void loadAvailability();
  }, []);

  async function loadSlots(dateIso: string) {
    setSlotsLoading(true);
    setSelectedTime(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/booking?date=${dateIso}`);
      const data = (await response.json()) as { slots?: string[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Kunne ikke hente ledige tider.");
      }

      setSlots(data.slots ?? []);
    } catch (error) {
      setSlots([]);
      setErrorMessage(error instanceof Error ? error.message : "Kunne ikke hente ledige tider.");
    } finally {
      setSlotsLoading(false);
    }
  }

  function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date);

    if (!date) {
      setSlots([]);
      setSelectedTime(null);
      return;
    }

    void loadSlots(formatDateIso(date));
  }

  const isDisabledDay = (date: Date) => date < startOfToday() || !availableDates.has(formatDateIso(date));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedDateIso || !selectedTime) {
      setErrorMessage("Velg dato og klokkeslett.");
      setFormState("error");
      return;
    }

    setFormState("submitting");
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const website = typeof formData.get("website") === "string" ? formData.get("website") : "";

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          service,
          date: selectedDateIso,
          time: selectedTime,
          message,
          website,
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string; cancelToken?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Noe gikk galt. Prøv igjen.");
      }

      if (!data.cancelToken) {
        throw new Error("Kunne ikke fullføre bestillingen.");
      }

      window.location.href = `/bestill-time/bekreftet?token=${encodeURIComponent(data.cancelToken)}`;
    } catch (error) {
      setFormState("error");
      setErrorMessage(error instanceof Error ? error.message : "Noe gikk galt. Prøv igjen.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="overflow-hidden rounded-2xl border border-stone/10 bg-white shadow-sm">
      <div className="grid grid-cols-3 border-b border-stone/10 bg-sage-light/25">
        {steps.map(({ id, label, Icon }) => {
          const isActive = activeStep === id;
          const isComplete = activeStep > id;

          return (
            <div
              key={id}
              className={`flex flex-col items-center gap-1.5 px-3 py-4 text-center sm:flex-row sm:justify-center sm:gap-2 ${
                isActive ? "bg-white/70" : ""
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                  isComplete
                    ? "bg-sage text-cream"
                    : isActive
                      ? "bg-stone text-cream"
                      : "bg-stone/10 text-stone/80"
                }`}
              >
                {isComplete ? <CheckIcon className="h-4 w-4" /> : id}
              </span>
              <span
                className={`hidden font-sans text-xs uppercase tracking-wider sm:inline ${
                  isActive ? "text-stone" : "text-stone/80"
                }`}
              >
                {label}
              </span>
              <Icon className="h-4 w-4 text-sage sm:hidden" />
            </div>
          );
        })}
      </div>

      <div className="grid gap-10 p-6 md:p-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-12">
        <section>
          <h2 className="text-heading-card mb-1">Velg dato</h2>
          <p className="text-body-sm mb-5">
            {availabilityLoading
              ? "Henter ledige dager …"
              : availableDates.size > 0
                ? "Kun markerte dager er åpne for timebestilling."
                : "Ingen ledige dager er lagt inn ennå. Ring oss for å avtale time."}
          </p>
          <div className={`booking-calendar w-full ${panelClassName}`}>
            <DayPicker
              mode="single"
              locale={nb}
              weekStartsOn={1}
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDisabledDay}
              classNames={{
                ...defaultClassNames,
                root: `${defaultClassNames.root} mx-auto font-sans`,
                month_caption: `${defaultClassNames.month_caption} mb-3 font-serif text-lg font-normal text-stone`,
                weekday: `${defaultClassNames.weekday} text-stone/80 text-[0.7rem] uppercase tracking-wider font-normal`,
                day: `${defaultClassNames.day} rounded-full`,
                day_button: `${defaultClassNames.day_button} text-stone hover:bg-sage-light/60 transition-colors`,
                disabled: `${defaultClassNames.disabled} opacity-30`,
              }}
            />
          </div>
        </section>

        <div className={`space-y-10 ${panelClassName}`}>
          <section>
            <h2 className="text-heading-card mb-1">Velg klokkeslett</h2>
            {!selectedDate && <p className="text-body-sm">Velg en dato i kalenderen for å se ledige tider.</p>}
            {selectedDate && slotsLoading && <p className="text-body-sm">Henter ledige tider …</p>}
            {selectedDate && !slotsLoading && slots.length === 0 && (
              <p className="text-body-sm">
                Ingen ledige tider {formatDayLabel(selectedDateIso!)}. Velg en annen dag.
              </p>
            )}
            {selectedDate && !slotsLoading && slots.length > 0 && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`cursor-pointer rounded-xl border px-3 py-2.5 font-sans text-sm font-normal transition-colors ${
                      selectedTime === slot
                        ? "border-sage bg-sage text-cream"
                        : "border-stone/10 bg-cream/40 text-stone hover:border-sage/30 hover:bg-sage-light/50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-heading-card mb-1">Dine opplysninger</h2>
            <p className="text-body-sm mb-6">Terje bekrefter timen og tar kontakt med deg.</p>

            <div className="grid gap-4 sm:grid-cols-2">
              <FloatingLabelField
                label="Fornavn *"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                fieldClassName={floatingFieldClassName}
                autoComplete="given-name"
              />

              <FloatingLabelField
                label="Etternavn *"
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                fieldClassName={floatingFieldClassName}
                autoComplete="family-name"
              />

              <FloatingLabelField
                label="Telefon *"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                fieldClassName={floatingFieldClassName}
                autoComplete="tel"
              />

              <FloatingLabelField
                label="E-post *"
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                fieldClassName={floatingFieldClassName}
                autoComplete="email"
              />

              <FloatingLabelSelect
                label="Behandling *"
                required
                value={service}
                onValueChange={setService}
                options={services}
                fieldClassName={floatingFieldClassName}
                className="sm:col-span-2"
              />

              <FloatingLabelTextarea
                label="Melding (valgfritt)"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                fieldClassName={floatingFieldClassName}
                className="sm:col-span-2"
              />
            </div>

            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

            {errorMessage && (
              <p className="mt-4 font-sans text-sm text-red-700" role="alert">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={formState === "submitting" || !selectedDate || !selectedTime}
              className="mt-8 w-full cursor-pointer rounded-full bg-stone px-8 py-4 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {formState === "submitting" ? "Sender …" : "Send timeforespørsel"}
            </button>
          </section>
        </div>
      </div>
    </form>
  );
}
