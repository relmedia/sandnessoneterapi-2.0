import Link from "next/link";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getArticles } from "@/lib/content";
import { deleteArticle } from "@/server/content-actions";

import { DeleteContentButton } from "../_components/delete-content-button";

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("nb-NO");
}

export default async function ArtiklerPage() {
  const articles = await getArticles();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Artikler</h1>
          <p className="text-muted-foreground text-sm">Fagstoff og artikler som vises på nettsiden.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/artikler/new">
            <Plus className="size-4" />
            Ny artikkel
          </Link>
        </Button>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tittel</TableHead>
              <TableHead className="hidden md:table-cell">Publisert</TableHead>
              <TableHead className="w-28 text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground py-10 text-center">
                  Ingen artikler ennå. Klikk «Ny artikkel» for å komme i gang.
                </TableCell>
              </TableRow>
            )}
            {articles.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/artikler/${article.id}`} className="hover:underline">
                    {article.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">
                  {formatDate(article.published_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/artikler/${article.id}`}>Rediger</Link>
                    </Button>
                    <DeleteContentButton id={article.id} label={article.title} action={deleteArticle} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
