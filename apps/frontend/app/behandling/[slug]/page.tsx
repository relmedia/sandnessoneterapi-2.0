import type { Metadata } from "next";

import Link from "next/link";
import { notFound } from "next/navigation";

import { getServiceBySlug, getSettings } from "@/lib/content";
import { bodyToHtml, formatPhone, telHref } from "@/lib/format";

export const revalidate = 60;

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(slug);
  if (!service) return { title: "Behandling ikke funnet" };
  return {
    title: service.title,
    description: service.short_description ?? undefined,
  };
}

export default async function BehandlingPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [service, settings] = await Promise.all([getServiceBySlug(slug), getSettings()]);

  if (!service) notFound();

  const phoneDisplay = formatPhone(settings.phone);
  const phoneTel = telHref(settings.phone);
  const bodyHtml = bodyToHtml(service.body);

  return (
    <article className="py-16 md:py-24">
      <div className="container-narrow section-padding mx-auto">
        <nav
          aria-label="Brødsmulesti"
          className="text-caption mb-12 flex items-center gap-2 tracking-widest uppercase"
        >
          <Link href="/" className="transition-colors hover:text-stone">
            Forside
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-stone">{service.title}</span>
        </nav>

        <p className="text-label mb-4">Behandling</p>
        <h1 className="text-heading-display mb-8">{service.title}</h1>

        {service.short_description && (
          <>
            <p className="text-body-lg mb-8 max-w-3xl border-l-4 border-sage pl-6">{service.short_description}</p>
            <div className="mb-12">
              <Link
                href="/bestill-time"
                className="inline-block rounded-full bg-sage px-8 py-4 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage-dark"
              >
                Bestill time
              </Link>
            </div>
          </>
        )}

        {service.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.image_url}
            alt={service.image_alt ?? service.title}
            className="mb-14 aspect-video w-full rounded-2xl bg-sage-light object-cover"
          />
        )}

        {bodyHtml && <div className="prose-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} />}

        <div className="mt-16 rounded-2xl bg-sage-light p-10 text-center">
          <h2 className="mb-3 font-serif text-2xl font-normal text-stone">Ønsker du en time?</h2>
          <p className="text-body-sm mb-6">Bestill online eller ring Terje direkte.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/bestill-time"
              className="inline-block rounded-full bg-sage px-8 py-4 font-sans text-sm font-normal tracking-wide text-cream transition-colors hover:bg-sage-dark"
            >
              Bestill time
            </Link>
            {phoneDisplay && (
              <a
                href={`tel:${phoneTel}`}
                className="inline-block rounded-full border border-sage/30 px-8 py-4 font-sans text-sm font-normal tracking-wide text-sage-dark transition-colors hover:bg-sage-light"
              >
                Ring {phoneDisplay}
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
