import Link from "next/link";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCourseRegistrations } from "@/lib/bookings";

import { RegistrationTable } from "./_components/registration-table";

export default async function KurspameldingerPage() {
  const registrations = await getCourseRegistrations();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Kurspåmeldinger</h1>
          <p className="text-muted-foreground text-sm">
            Påmeldinger til kurs som ikke er ferdige ennå. Bekreft plassen og avtal betaling med deltakeren.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/kurspameldinger/historikk">
            <History className="size-4" />
            Tidligere påmeldinger
          </Link>
        </Button>
      </div>

      <RegistrationTable
        registrations={registrations}
        emptyMessage="Ingen kommende påmeldinger. Nye påmeldinger fra nettsiden dukker opp her."
      />
    </div>
  );
}
