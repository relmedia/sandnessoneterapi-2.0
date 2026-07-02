import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CourseRegistrationTrigger } from "@/components/course-registration-modal";
import { createBookingClient } from "@/lib/booking-store";
import { buildCourseSessionAvailability, getCourseSessionLabels } from "@/lib/course-registration";
import { getCourseBySlug, getSettings } from "@/lib/content";
import { bodyToHtml, formatPhone, formatPrice, telHref } from "@/lib/format";

export const revalidate = 60;

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Kurs" };
  return {
    title: course.title,
    description: course.short_description ?? "Kurs i soneterapi med Terje Horpestad.",
  };
}

function CalendarIcon({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 2.5V6M16 2.5V6" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z" strokeLinejoin="round" />
      <circle cx="12" cy="11" r="2.2" />
    </svg>
  );
}

async function getActiveRegistrationCounts(courseSlug: string): Promise<Record<string, number>> {
  const supabase = createBookingClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("course_registrations")
    .select("session_label")
    .eq("course_slug", courseSlug)
    .neq("status", "cancelled");

  if (error || !data) return {};

  const counts: Record<string, number> = {};
  for (const row of data as { session_label: string | null }[]) {
    if (!row.session_label) continue;
    counts[row.session_label] = (counts[row.session_label] ?? 0) + 1;
  }
  return counts;
}

export default async function KursDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [course, settings] = await Promise.all([getCourseBySlug(slug), getSettings()]);

  if (!course) notFound();

  const telDisplay = formatPhone(settings.phone);
  const tel = telHref(settings.phone);
  const bodyHtml = bodyToHtml(course.body);

  const sessionLabels = getCourseSessionLabels(course);
  const registrationCounts = await getActiveRegistrationCounts(course.slug);
  const sessions = buildCourseSessionAvailability(course, registrationCounts);

  const registrationProps = {
    courseSlug: course.slug,
    courseTitle: course.title,
    sessions,
    price: course.price,
    phoneDisplay: telDisplay || null,
    phoneTel: tel,
    location: course.location,
    mapsUrl: course.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(course.location.trim())}`
      : null,
  };

  return (
    <div className="py-16 md:py-24">
      <article className="container-wide section-padding mx-auto max-w-3xl">
        <nav
          aria-label="Brødsmulesti"
          className="mb-8 flex flex-wrap items-center gap-2 font-sans text-xs font-normal tracking-widest text-stone/60 uppercase"
        >
          <Link href="/" className="transition-colors hover:text-sage-dark">
            Forside
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/kurs" className="transition-colors hover:text-sage-dark">
            Kurs
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-sage-dark">{course.title}</span>
        </nav>

        <h1 className="text-heading-display mb-6">{course.title}</h1>

        <div className="mb-8 flex flex-wrap items-center gap-4">
          {course.location && (
            <span className="flex items-center gap-1.5 font-sans text-sm font-normal text-stone/70">
              <PinIcon className="size-4 text-sage-dark" />
              {course.location}
            </span>
          )}
          {course.price != null && (
            <span className="rounded-full border border-stone/25 px-3 py-1 font-sans text-sm font-normal text-stone/80">
              {formatPrice(course.price)}
            </span>
          )}
        </div>

        {sessionLabels.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {sessionLabels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-sage-light/60 px-3.5 py-1.5 font-sans text-sm font-normal text-sage-dark"
              >
                <CalendarIcon className="size-4" />
                {label}
              </span>
            ))}
          </div>
        )}

        {course.short_description && (
          <blockquote className="mb-8 border-l-2 border-sage pl-5 font-sans text-lg font-normal leading-relaxed text-stone/90">
            {course.short_description}
          </blockquote>
        )}

        <div className="mb-10">
          <CourseRegistrationTrigger {...registrationProps} />
        </div>

        {course.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.image_url}
            alt={course.title}
            className="mb-10 w-full rounded-2xl object-contain"
          />
        )}

        {bodyHtml && <div className="prose-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} />}

        {telDisplay && (
          <div className="mt-14 rounded-2xl bg-sage-light/50 p-8 text-center md:p-10">
            <h2 className="mb-2 font-serif text-2xl font-normal text-stone">Interessert i kurset?</h2>
            <p className="mb-6 font-sans text-base font-normal text-stone/80">
              Ta kontakt med Terje for påmelding eller spørsmål.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={tel}
                className="inline-block rounded-full bg-sage-dark px-6 py-3 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage"
              >
                Ring {telDisplay}
              </a>
              <CourseRegistrationTrigger
                {...registrationProps}
                className="inline-block cursor-pointer rounded-full border border-stone/30 px-6 py-3 font-sans text-sm font-normal tracking-wide text-stone transition-colors hover:border-sage hover:text-sage-dark"
              />
            </div>
          </div>
        )}

        <div className="mt-10">
          <Link
            href="/kurs"
            className="inline-flex items-center gap-1.5 font-sans text-sm font-normal tracking-wide text-stone/70 transition-colors hover:text-sage-dark"
          >
            <span aria-hidden="true">←</span> Tilbake til kurs
          </Link>
        </div>
      </article>
    </div>
  );
}
