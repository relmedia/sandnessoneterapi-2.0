import { getAvailabilityDays } from "@/lib/bookings";

import { AvailabilityManager } from "./_components/availability-manager";

export default async function LedigeDagerPage() {
  const days = await getAvailabilityDays();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Ledige dager</h1>
        <p className="text-muted-foreground text-sm">
          Dager og klokkeslett som er åpne for timebestilling på nettsiden.
        </p>
      </div>

      <AvailabilityManager days={days} />
    </div>
  );
}
