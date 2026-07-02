import type { Metadata } from "next";

import { getPage } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Priser",
  description: "Priser for soneterapi, øreakupunktur og tankefeltterapi i Sandnes.",
};

const defaultPrices = [
  { label: "Soneterapi – 1 time", price: "850 kr" },
  { label: "Øreakupunktur", price: "850 kr" },
  { label: "Tankefeltterapi", price: "850 kr" },
];

export default async function PriserPage() {
  const page = await getPage("priser");

  return (
    <div className="py-16 md:py-24">
      <div className="container-narrow section-padding mx-auto">
        <p className="text-label mb-4">Oversikt</p>
        <h1 className="text-heading-display mb-12">{page?.title ?? "Priser"}</h1>

        <div className="mb-12 divide-y divide-warm-light border-t border-b border-warm-light">
          {defaultPrices.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 py-5">
              <span className="font-sans font-normal text-stone">{item.label}</span>
              <span className="text-right font-serif text-xl text-sage-dark">{item.price}</span>
            </div>
          ))}
        </div>

        {page?.body && (
          <div className="prose-content mb-12" dangerouslySetInnerHTML={{ __html: page.body }} />
        )}
      </div>
    </div>
  );
}
