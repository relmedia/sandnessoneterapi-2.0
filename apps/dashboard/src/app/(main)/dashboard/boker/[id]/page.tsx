import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBook } from "@/lib/content";

import { BookForm } from "../_components/book-form";

export default async function BookEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const book = isNew ? null : await getBook(id);

  if (!isNew && !book) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {isNew ? "Ny bok" : "Rediger bok"}
        </h1>
        <p className="text-muted-foreground text-sm">Endringer vises på nettsiden etter lagring.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Opprett bok" : book?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <BookForm book={book} />
        </CardContent>
      </Card>
    </div>
  );
}
