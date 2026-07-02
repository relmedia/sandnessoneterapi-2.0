import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getCourseRegistrations } from "@/lib/bookings";
import { deleteCourseRegistration } from "@/server/booking-actions";
import type { BookingStatus } from "@/types/booking";

import { DeleteContentButton } from "../_components/delete-content-button";

import { RegistrationActions } from "./_components/registration-actions";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" });
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  return phone;
}

const statusLabels: Record<BookingStatus, string> = {
  pending: "Venter",
  confirmed: "Bekreftet",
  cancelled: "Avlyst",
};

function StatusBadge({ status }: { readonly status: BookingStatus }) {
  const variant = status === "confirmed" ? "default" : status === "cancelled" ? "outline" : "secondary";
  return <Badge variant={variant}>{statusLabels[status] ?? status}</Badge>;
}

export default async function KurspameldingerPage() {
  const registrations = await getCourseRegistrations();

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Kurspåmeldinger</h1>
        <p className="text-muted-foreground text-sm">
          Påmeldinger fra nettsiden. Bekreft plassen og avtal betaling med deltakeren.
        </p>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kurs</TableHead>
              <TableHead>Navn</TableHead>
              <TableHead className="hidden lg:table-cell">Kontakt</TableHead>
              <TableHead className="hidden md:table-cell">Påmeldt</TableHead>
              <TableHead className="w-28 text-center">Status</TableHead>
              <TableHead className="w-56 text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                  Ingen kurspåmeldinger ennå. Nye påmeldinger fra nettsiden dukker opp her.
                </TableCell>
              </TableRow>
            )}
            {registrations.map((registration) => (
              <TableRow key={registration.id}>
                <TableCell className="font-medium">
                  <div>{registration.course_title}</div>
                  {registration.session_label && (
                    <p className="text-muted-foreground mt-0.5 text-xs font-normal">{registration.session_label}</p>
                  )}
                </TableCell>
                <TableCell>
                  <div>
                    {registration.first_name} {registration.last_name}
                  </div>
                  {registration.message && (
                    <p className="text-muted-foreground mt-0.5 max-w-72 truncate text-xs" title={registration.message}>
                      {registration.message}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground hidden lg:table-cell">
                  <div className="text-xs">
                    <div>{registration.email}</div>
                    <div>{formatPhone(registration.phone)}</div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden whitespace-nowrap md:table-cell">
                  {formatDateTime(registration.created_at)}
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={registration.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <RegistrationActions id={registration.id} status={registration.status} />
                    <DeleteContentButton
                      id={registration.id}
                      label={`${registration.first_name} ${registration.last_name}`}
                      action={deleteCourseRegistration}
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
