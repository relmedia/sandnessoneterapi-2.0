import type { Metadata } from "next";
import Link from "next/link";

import { getArticles } from "@/lib/content";
import { formatDateNb } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Artikler",
  description: "Artikler om soneterapi, helse og velvære av Terje Horpestad.",
};

export default async function ArtiklerPage() {
  const articles = await getArticles();

  return (
    <div className="py-16 md:py-24">
      <div className="container-wide section-padding mx-auto">
        <p className="text-label mb-4">Fagstoff</p>
        <h1 className="text-heading-display mb-16">Artikler om soneterapi</h1>

        {articles.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link key={article.id} href={`/artikler/${article.slug}`} className="group block">
                {article.cover_image_url ? (
                  <div className="relative mb-5 aspect-[16/9] overflow-hidden rounded-2xl bg-sage-light">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={article.cover_image_url}
                      alt={article.title}
                      className="absolute inset-0 size-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="mb-5 aspect-[16/9] rounded-2xl bg-sage-light" />
                )}
                {article.published_at && (
                  <p className="mb-2 font-sans text-xs tracking-widest text-sage uppercase">
                    {formatDateNb(article.published_at)}
                  </p>
                )}
                <h2 className="text-heading-card mb-2 font-semibold transition-colors group-hover:text-sage-dark">
                  {article.title}
                </h2>
                {article.excerpt && <p className="text-body-sm">{article.excerpt}</p>}
                <span className="mt-3 inline-block font-sans text-xs tracking-widest text-sage uppercase">
                  Les artikkelen →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-body-lg">Artikler legges til snart.</p>
        )}
      </div>
    </div>
  );
}
