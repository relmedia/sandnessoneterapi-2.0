import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBookingRequests } from "@/lib/bookings";
import { deleteBooking } from "@/server/booking-actions";
import type { BookingStatus } from "@/types/booking";

import { DeleteContentButton } from "../_components/delete-content-button";

import { BookingActions } from "./_components/booking-actions";

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("nb-NO", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  return phone;
}

const statusLabels: Record<BookingStatus, string> = {
  pending: "Venter",
  confirmed: "Bekreftet",
  cancelled: "Avbestilt",
};

function StatusBadge({ status }: { readonly status: BookingStatus }) {
  const variant = status === "confirmed" ? "default" : status === "cancelled" ? "outline" : "secondary";
  return <Badge variant={variant}>{statusLabels[status] ?? status}</Badge>;
}

export default async function BestillingerPage() {
  const bookings = await getBookingRequests();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Timebestillinger</h1>
        <p className="text-muted-foreground text-sm">
          Timeforespørsler fra nettsiden. Bekreft via e-postlenken eller knappen her – kunden får da bekreftelse på e-post.
        </p>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dato og tid</TableHead>
              <TableHead>Navn</TableHead>
              <TableHead className="hidden lg:table-cell">Kontakt</TableHead>
              <TableHead className="hidden md:table-cell">Behandling</TableHead>
              <TableHead className="w-28 text-center">Status</TableHead>
              <TableHead className="w-56 text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                  Ingen bestillinger ennå. Nye timeforespørsler fra nettsiden dukker opp her.
                </TableCell>
              </TableRow>
            )}
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="whitespace-nowrap font-medium">
                  {formatDate(booking.date)}
                  <span className="text-muted-foreground"> kl. {booking.time}</span>
                </TableCell>
                <TableCell>
                  <div>
                    {booking.first_name} {booking.last_name}
                  </div>
                  {booking.message && (
                    <p className="text-muted-foreground mt-0.5 max-w-72 truncate text-xs" title={booking.message}>
                      {booking.message}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground hidden lg:table-cell">
                  <div className="text-xs">
                    <div>{booking.email}</div>
                    <div>{formatPhone(booking.phone)}</div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">{booking.service}</TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={booking.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <BookingActions id={booking.id} status={booking.status} />
                    <DeleteContentButton
                      id={booking.id}
                      label={`${booking.first_name} ${booking.last_name}`}
                      action={deleteBooking}
                    />
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
