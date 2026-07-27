import { getCourseRegistrations } from "@/lib/bookings";

import { RegistrationTable } from "./_components/registration-table";

export default async function KurspameldingerPage() {
  const registrations = await getCourseRegistrations();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Kurspåmeldinger</h1>
        <p className="text-muted-foreground text-sm">
          Påmeldinger til kurs som ikke er ferdige ennå. Bekreft plassen og avtal betaling med deltakeren.
        </p>
      </div>

      <RegistrationTable
        registrations={registrations}
        emptyMessage="Ingen kommende påmeldinger. Nye påmeldinger fra nettsiden dukker opp her."
      />
    </div>
  );
}
