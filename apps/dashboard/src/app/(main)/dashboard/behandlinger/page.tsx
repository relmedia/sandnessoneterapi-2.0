import Link from "next/link";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getServices } from "@/lib/content";
import { deleteService } from "@/server/content-actions";

import { DeleteContentButton } from "../_components/delete-content-button";

export default async function BehandlingerPage() {
  const services = await getServices();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Behandlinger</h1>
          <p className="text-muted-foreground text-sm">Behandlingene som vises på nettsiden.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/behandlinger/new">
            <Plus className="size-4" />
            Ny behandling
          </Link>
        </Button>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tittel</TableHead>
              <TableHead className="hidden md:table-cell">Slug</TableHead>
              <TableHead className="w-20 text-center">Rekkefølge</TableHead>
              <TableHead className="w-28 text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                  Ingen behandlinger ennå. Klikk «Ny behandling» for å komme i gang.
                </TableCell>
              </TableRow>
            )}
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">
                  <Link href={`/dashboard/behandlinger/${service.id}`} className="hover:underline">
                    {service.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">{service.slug}</TableCell>
                <TableCell className="text-center">{service.order}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/behandlinger/${service.id}`}>Rediger</Link>
                    </Button>
                    <DeleteContentButton id={service.id} label={service.title} action={deleteService} />
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
