import Link from "next/link";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPages } from "@/lib/content";
import { deletePage } from "@/server/content-actions";

import { DeleteContentButton } from "../_components/delete-content-button";

export default async function SiderPage() {
  const pages = await getPages();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Sider</h1>
          <p className="text-muted-foreground text-sm">Faste sider som Om meg, Priser og Foredrag.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sider/new">
            <Plus className="size-4" />
            Ny side
          </Link>
        </Button>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tittel</TableHead>
              <TableHead className="hidden md:table-cell">Slug</TableHead>
              <TableHead className="w-28 text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground py-10 text-center">
                  Ingen sider ennå. Klikk «Ny side» for å komme i gang.
                </TableCell>
              </TableRow>
            )}
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/sider/${page.id}`} className="hover:underline">
                    {page.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">/{page.slug}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/sider/${page.id}`}>Rediger</Link>
                    </Button>
                    <DeleteContentButton id={page.id} label={page.title} action={deletePage} />
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
