import Link from "next/link";

import type { Course } from "@/lib/content";
import { formatPrice } from "@/lib/format";

export function PinIcon({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

export function CapIcon({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <path d="M3 9l9-4 9 4-9 4-9-4Z" strokeLinejoin="round" />
      <path d="M7 11v4c0 1.1 2.2 2.5 5 2.5s5-1.4 5-2.5v-4" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowIcon({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CoursePlaceholder({ className }: { readonly className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-sage-light/40 ${className ?? ""}`}>
      <CapIcon className="size-10 text-sage-dark/70" />
    </div>
  );
}

export function LocationRow({ location }: { readonly location: string | null }) {
  if (!location) return null;
  return (
    <p className="flex items-center gap-1.5 font-sans text-sm font-normal text-stone/70">
      <PinIcon className="size-4 text-sage-dark" />
      {location}
    </p>
  );
}

// Card layout ported from the original app's CourseCard component.
export function CourseCard({ course }: { readonly course: Course }) {
  return (
    <Link
      href={`/kurs/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sage/25 hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-sage-light">
        {course.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.image_url}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <CoursePlaceholder className="h-full w-full" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-stone/30 via-transparent to-transparent" />
        {course.price != null && (
          <span className="absolute top-4 right-4 rounded-full border border-white/40 bg-white/90 px-3 py-1 font-sans text-xs font-medium whitespace-nowrap text-stone shadow-sm backdrop-blur-sm">
            {formatPrice(course.price)}
          </span>
        )}
        <span className="absolute bottom-4 left-4 flex size-11 items-center justify-center rounded-xl bg-cream/90 text-sage-dark shadow-sm backdrop-blur-sm">
          <CapIcon className="size-5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <h3 className="font-serif text-2xl font-semibold text-stone transition-colors group-hover:text-sage-dark">
          {course.title}
        </h3>
        {course.short_description && (
          <p className="mt-3 line-clamp-3 flex-1 font-sans text-base font-normal leading-relaxed text-stone/90">
            {course.short_description}
          </p>
        )}
        {course.location && (
          <div className="mt-4 font-sans text-sm font-normal text-stone/80">
            <span className="inline-flex items-center gap-1.5">
              <PinIcon className="size-3.5 shrink-0" />
              {course.location}
            </span>
          </div>
        )}
        <span className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-normal tracking-wide text-sage-dark">
          Les mer
          <ArrowIcon className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
