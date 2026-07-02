import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPage } from "@/lib/content";

import { PageForm } from "../_components/page-form";

export default async function PageEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const page = isNew ? null : await getPage(id);

  if (!isNew && !page) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {isNew ? "Ny side" : "Rediger side"}
        </h1>
        <p className="text-muted-foreground text-sm">Endringer vises på nettsiden etter lagring.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Opprett side" : page?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <PageForm page={page} />
        </CardContent>
      </Card>
    </div>
  );
}
