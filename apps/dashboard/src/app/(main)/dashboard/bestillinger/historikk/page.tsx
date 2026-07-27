import { getPastBookingRequests } from "@/lib/bookings";

import { BookingTable } from "../_components/booking-table";

export default async function BestillingerHistorikkPage() {
  const bookings = await getPastBookingRequests();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Tidligere bestillinger</h1>
        <p className="text-muted-foreground text-sm">
          Timer som har passert, med alle opplysningene om den som bestilte. Søk for å finne en tidligere kunde.
        </p>
      </div>

      <BookingTable
        bookings={bookings}
        emptyMessage="Ingen tidligere bestillinger ennå. Timer flyttes hit automatisk dagen etter at de har passert."
      />
    </div>
  );
}
