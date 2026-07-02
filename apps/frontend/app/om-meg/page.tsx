import type { Metadata } from "next";

import { getPage } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Om meg",
  description:
    "Om Terje Horpestad – soneterapeut, lærer og forfatter med over 40 års erfaring innen soneterapi.",
};

export default async function OmMegPage() {
  const page = await getPage("om-meg");

  return (
    <div className="py-16 md:py-24">
      <div className="container-narrow section-padding mx-auto">
        <p className="text-label mb-4">Om terapeuten</p>
        <h1 className="text-heading-display mb-12">{page?.title ?? "Om meg"}</h1>
        <div className="prose-content" dangerouslySetInnerHTML={{ __html: page?.body ?? "" }} />
      </div>
    </div>
  );
}
