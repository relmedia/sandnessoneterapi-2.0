import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ReadMore } from "@/components/read-more";
import { getArticleBySlug, getArticles } from "@/lib/content";
import { bodyToHtml, formatDateNb } from "@/lib/format";

export const revalidate = 60;

type Params = { slug: string };

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Artikkel ikke funnet" };
  return {
    title: article.title,
    description: article.excerpt ?? undefined,
  };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const bodyHtml = bodyToHtml(article.body);

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
          <Link href="/artikler" className="transition-colors hover:text-stone">
            Artikler
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-stone">{article.title}</span>
        </nav>

        {article.published_at && (
          <p className="text-label mb-4">{formatDateNb(article.published_at)}</p>
        )}

        <h1 className="text-heading-display mb-8">{article.title}</h1>

        {article.excerpt && (
          <p className="text-body-lg mb-12 border-l-4 border-sage pl-6 leading-relaxed">{article.excerpt}</p>
        )}

        {article.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="mb-14 w-full rounded-2xl bg-sage-light object-contain"
          />
        )}

        {bodyHtml && (
          <ReadMore>
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          </ReadMore>
        )}

        <div className="mt-16 border-t border-warm-light pt-8">
          <Link
            href="/artikler"
            className="font-sans text-sm font-normal text-stone/80 transition-colors hover:text-stone"
          >
            ← Tilbake til artikler
          </Link>
        </div>
      </div>
    </article>
  );
}
