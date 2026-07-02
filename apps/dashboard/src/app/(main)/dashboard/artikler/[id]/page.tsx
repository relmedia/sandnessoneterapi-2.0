import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getArticle } from "@/lib/content";

import { ArticleForm } from "../_components/article-form";

export default async function ArticleEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const article = isNew ? null : await getArticle(id);

  if (!isNew && !article) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {isNew ? "Ny artikkel" : "Rediger artikkel"}
        </h1>
        <p className="text-muted-foreground text-sm">Endringer vises på nettsiden etter lagring.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Opprett artikkel" : article?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleForm article={article} />
        </CardContent>
      </Card>
    </div>
  );
}
