import { getPastCourseRegistrations } from "@/lib/bookings";

import { RegistrationTable } from "../_components/registration-table";

export default async function KurspameldingerHistorikkPage() {
  const registrations = await getPastCourseRegistrations();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Tidligere påmeldinger</h1>
        <p className="text-muted-foreground text-sm">
          Påmeldinger til kurs som er ferdige, med alle opplysningene om deltakeren.
        </p>
      </div>

      <RegistrationTable
        registrations={registrations}
        emptyMessage="Ingen tidligere påmeldinger ennå. Påmeldinger flyttes hit når kurset er ferdig."
      />
    </div>
  );
}
