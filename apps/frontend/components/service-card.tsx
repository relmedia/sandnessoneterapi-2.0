import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { getServiceIcon } from "@/lib/service-icons";

export function ServiceCard({
  title,
  slug,
  description,
  imageUrl,
  imageAlt,
}: {
  readonly title: string;
  readonly slug: string;
  readonly description: string | null;
  readonly imageUrl: string | null;
  readonly imageAlt: string | null;
}) {
  const Icon = getServiceIcon(slug);

  return (
    <Link
      href={`/behandling/${slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sage/25 hover:shadow-lg"
    >
      {imageUrl ? (
        <div className="relative aspect-16/10 overflow-hidden bg-sage-light">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={imageAlt ?? title}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-t from-stone/30 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/90 shadow-sm backdrop-blur-sm">
            <Icon className="h-5 w-5 text-sage-dark" strokeWidth={1.5} aria-hidden />
          </div>
        </div>
      ) : (
        <div className="relative aspect-16/10 overflow-hidden bg-linear-to-br from-sage-light via-cream to-warm-light/60">
          <div aria-hidden className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-sage/10 blur-2xl" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/80 shadow-md ring-1 ring-stone/5 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105">
              <Icon className="h-9 w-9 text-sage-dark" strokeWidth={1.5} aria-hidden />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6 md:p-7">
        <h3 className="font-serif text-2xl font-semibold text-stone transition-colors group-hover:text-sage-dark">
          {title}
        </h3>
        {description && (
          <p className="mt-3 flex-1 font-sans text-base font-normal leading-relaxed text-stone/90">{description}</p>
        )}
        <span className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-normal text-sage-dark">
          Les mer
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
