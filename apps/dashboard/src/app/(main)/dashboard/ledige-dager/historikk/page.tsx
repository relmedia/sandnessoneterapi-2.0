import Link from "next/link";

import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPastAvailabilityDays } from "@/lib/bookings";

import { AvailabilityDayTable } from "../_components/availability-day-table";
import { DeletePastDaysButton } from "./_components/delete-past-days-button";

export default async function LedigeDagerHistorikkPage() {
  const days = await getPastAvailabilityDays();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Tidligere dager</h1>
          <p className="text-muted-foreground text-sm">
            Dager som har vært åpne for timebestilling, men som nå har passert. De vises ikke på nettsiden.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/ledige-dager">
              <CalendarDays className="size-4" />
              Kommende dager
            </Link>
          </Button>
          {days.length > 0 && <DeletePastDaysButton count={days.length} />}
        </div>
      </div>

      <AvailabilityDayTable
        days={days}
        emptyMessage="Ingen tidligere dager ennå. Dager flyttes hit automatisk dagen etter at de har passert."
      />
    </div>
  );
}
