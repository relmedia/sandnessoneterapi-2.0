import Link from "next/link";

import { History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getBookingRequests } from "@/lib/bookings";

import { BookingTable } from "./_components/booking-table";

export default async function BestillingerPage() {
  const bookings = await getBookingRequests();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Timebestillinger</h1>
          <p className="text-muted-foreground text-sm">
            Kommende timeforespørsler fra nettsiden. Bekreft via e-postlenken eller knappen her – kunden får da
            bekreftelse på e-post.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/bestillinger/historikk">
            <History className="size-4" />
            Tidligere bestillinger
          </Link>
        </Button>
      </div>

      <BookingTable
        bookings={bookings}
        emptyMessage="Ingen kommende bestillinger. Nye timeforespørsler fra nettsiden dukker opp her."
      />
    </div>
  );
}
