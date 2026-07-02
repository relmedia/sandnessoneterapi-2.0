import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getService } from "@/lib/content";

import { ServiceForm } from "../_components/service-form";

export default async function ServiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const service = isNew ? null : await getService(id);

  if (!isNew && !service) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {isNew ? "Ny behandling" : "Rediger behandling"}
        </h1>
        <p className="text-muted-foreground text-sm">Endringer vises på nettsiden etter lagring.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Opprett behandling" : service?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ServiceForm service={service} />
        </CardContent>
      </Card>
    </div>
  );
}
