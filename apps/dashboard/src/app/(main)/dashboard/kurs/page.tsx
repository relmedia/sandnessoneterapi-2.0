import Link from "next/link";

import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCourses } from "@/lib/content";
import { deleteCourse } from "@/server/content-actions";

import { DeleteContentButton } from "../_components/delete-content-button";

function formatPrice(price: number | null) {
  return price == null ? "—" : `${price.toLocaleString("nb-NO")} kr`;
}

export default async function KursPage() {
  const courses = await getCourses();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Kurs</h1>
          <p className="text-muted-foreground text-sm">Kurs og utdanning som vises på nettsiden.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/kurs/new">
            <Plus className="size-4" />
            Nytt kurs
          </Link>
        </Button>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tittel</TableHead>
              <TableHead className="hidden md:table-cell">Pris</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
              <TableHead className="w-28 text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                  Ingen kurs ennå. Klikk «Nytt kurs» for å komme i gang.
                </TableCell>
              </TableRow>
            )}
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/kurs/${course.id}`} className="hover:underline">
                    {course.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">
                  {formatPrice(course.price)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={course.active === false ? "secondary" : "default"}>
                    {course.active === false ? "Skjult" : "Synlig"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/kurs/${course.id}`}>Rediger</Link>
                    </Button>
                    <DeleteContentButton id={course.id} label={course.title} action={deleteCourse} />
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
