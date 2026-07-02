import Link from "next/link";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBooks } from "@/lib/content";
import { deleteBook } from "@/server/content-actions";

import { DeleteContentButton } from "../_components/delete-content-button";

export default async function BokerPage() {
  const books = await getBooks();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Bøker</h1>
          <p className="text-muted-foreground text-sm">Bøker og hefter som vises på nettsiden.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/boker/new">
            <Plus className="size-4" />
            Ny bok
          </Link>
        </Button>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tittel</TableHead>
              <TableHead className="hidden md:table-cell">ISBN</TableHead>
              <TableHead className="w-20 text-center">Rekkefølge</TableHead>
              <TableHead className="w-28 text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {books.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                  Ingen bøker ennå. Klikk «Ny bok» for å komme i gang.
                </TableCell>
              </TableRow>
            )}
            {books.map((book) => (
              <TableRow key={book.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/boker/${book.id}`} className="hover:underline">
                    {book.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">
                  {book.isbn ?? "—"}
                </TableCell>
                <TableCell className="text-center">{book.order}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/boker/${book.id}`}>Rediger</Link>
                    </Button>
                    <DeleteContentButton id={book.id} label={book.title} action={deleteBook} />
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
