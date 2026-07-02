"use client";

import Link from "next/link";
import { useState } from "react";

import { ArrowIcon, CourseCard, CoursePlaceholder, LocationRow } from "@/components/course-card";
import type { Course } from "@/lib/content";
import { formatPrice } from "@/lib/format";

type View = "liste" | "kort";

function ListIcon({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <path d="M8 6h13M8 12h13M8 18h13" strokeLinecap="round" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GridIcon({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

const VIEW_META = {
  liste: { label: "Liste", Icon: ListIcon },
  kort: { label: "Kort", Icon: GridIcon },
} as const;

function PricePill({ price }: { readonly price: number | null }) {
  if (price == null) return null;
  return (
    <span className="shrink-0 rounded-full border border-stone/25 px-3 py-1 font-sans text-sm font-normal whitespace-nowrap text-stone/80">
      {formatPrice(price)}
    </span>
  );
}

function ListCard({ course, telDisplay, telLink }: {
  readonly course: Course;
  readonly telDisplay: string;
  readonly telLink: string;
}) {
  return (
    <article className="group relative grid overflow-hidden rounded-2xl border border-warm-light bg-cream shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sage/25 hover:shadow-lg md:grid-cols-[280px_1fr]">
      <Link href={`/kurs/${course.slug}`} className="relative block overflow-hidden">
        {course.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.image_url}
            alt={course.title}
            className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-full"
          />
        ) : (
          <CoursePlaceholder className="h-56 w-full md:h-full" />
        )}
      </Link>
      <div className="flex flex-col p-6 md:p-8">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="font-serif text-xl font-normal text-stone sm:text-2xl md:text-3xl">
            <Link href={`/kurs/${course.slug}`} className="transition-colors hover:text-sage-dark">
              {course.title}
            </Link>
          </h2>
          <PricePill price={course.price} />
        </div>
        <div className="mb-4">
          <LocationRow location={course.location} />
        </div>
        {course.short_description && (
          <p className="flex-1 font-sans text-base font-normal leading-relaxed text-stone/90">
            {course.short_description}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href={`/kurs/${course.slug}`}
            className="group/lesmer inline-flex items-center gap-2 font-sans text-sm font-normal tracking-wide text-sage-dark transition-colors hover:text-sage"
          >
            Les mer
            <ArrowIcon className="size-4 transition-transform duration-300 group-hover/lesmer:translate-x-1" />
          </Link>
          {telDisplay && (
            <a
              href={telLink}
              className="inline-block rounded-full bg-sage-dark px-5 py-2.5 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage"
            >
              Kontakt – {telDisplay}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function KursList({ courses, telDisplay, telLink }: {
  readonly courses: Course[];
  readonly telDisplay: string;
  readonly telLink: string;
}) {
  const [view, setView] = useState<View>("liste");

  if (courses.length === 0) {
    return (
      <p className="text-body-lg max-w-xl">
        Ingen planlagte kurs for øyeblikket.
        {telDisplay ? ` Ring for mer informasjon: ${telDisplay}.` : ""}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-8 flex justify-end">
        <div className="inline-flex items-center gap-1 rounded-full border border-warm-light bg-cream p-1">
          {(["liste", "kort"] as const).map((option) => {
            const { label, Icon } = VIEW_META[option];
            return (
              <button
                key={option}
                type="button"
                onClick={() => setView(option)}
                aria-pressed={view === option}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-sans text-sm font-normal tracking-wide transition-colors ${
                  view === option ? "bg-stone text-cream" : "text-stone/70 hover:text-stone"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {view === "liste" ? (
        <div className="flex flex-col gap-6">
          {courses.map((course) => (
            <ListCard key={course.id} course={course} telDisplay={telDisplay} telLink={telLink} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
