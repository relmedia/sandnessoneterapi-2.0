"use client";

import { Fragment, useMemo, useState } from "react";

import { ChevronRight, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseAvailabilityDate } from "@/lib/availability";
import { cn } from "@/lib/utils";
import { deleteBooking } from "@/server/booking-actions";
import type { BookingRequest, BookingStatus } from "@/types/booking";

import { DeleteContentButton } from "../../_components/delete-content-button";

import { BookingActions } from "./booking-actions";

type StatusFilter = "all" | BookingStatus;

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Venter",
  confirmed: "Bekreftet",
  cancelled: "Avbestilt",
};

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Alle statuser",
  pending: "Venter",
  confirmed: "Bekreftet",
  cancelled: "Avbestilt",
};

function formatDate(value: string): string {
  const date = parseAvailabilityDate(value);
  if (!date) return value;
  return date.toLocaleDateString("nb-NO", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  return phone;
}

function formatTimestamp(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("nb-NO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { readonly status: BookingStatus }) {
  const variant = status === "confirmed" ? "default" : status === "cancelled" ? "outline" : "secondary";
  return <Badge variant={variant}>{STATUS_LABELS[status] ?? status}</Badge>;
}

// Everything a booking can be searched by, including the date in ISO, dotted
// and Norwegian form.
function searchable(booking: BookingRequest): string {
  const parsed = parseAvailabilityDate(booking.date);
  const dotted = parsed
    ? `${String(parsed.getDate()).padStart(2, "0")}.${String(parsed.getMonth() + 1).padStart(2, "0")}.${parsed.getFullYear()}`
    : "";
  return [
    booking.first_name,
    booking.last_name,
    booking.email,
    booking.phone,
    formatPhone(booking.phone),
    booking.service,
    booking.date,
    dotted,
    formatDate(booking.date),
    booking.time,
    booking.message ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function DetailRow({ label, children }: { readonly label: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export function BookingTable({
  bookings,
  emptyMessage,
}: {
  readonly bookings: BookingRequest[];
  readonly emptyMessage: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasFilters = query.trim() !== "" || status !== "all";

  const visibleBookings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (needle && !searchable(booking).includes(needle)) return false;
      if (status !== "all" && booking.status !== status) return false;
      return true;
    });
  }, [bookings, query, status]);

  const resetFilters = () => {
    setQuery("");
    setStatus("all");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="h-9 w-full sm:w-72">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Søk i bestillinger"
            placeholder="Søk på navn, e-post, telefon eller dato"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Tøm søk" onClick={() => setQuery("")}>
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>

        <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
          <SelectTrigger aria-label="Filtrer på status" className="h-9 w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map((value) => (
              <SelectItem key={value} value={value}>
                {STATUS_FILTER_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" onClick={resetFilters}>
            Nullstill
          </Button>
        )}

        <span className="text-muted-foreground ml-auto text-xs">
          Viser {visibleBookings.length} av {bookings.length}{" "}
          {bookings.length === 1 ? "bestilling" : "bestillinger"}
        </span>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Dato og tid</TableHead>
              <TableHead>Navn</TableHead>
              <TableHead className="hidden lg:table-cell">Kontakt</TableHead>
              <TableHead className="hidden md:table-cell">Behandling</TableHead>
              <TableHead className="w-28 text-center">Status</TableHead>
              <TableHead className="w-56 text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleBookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                  {bookings.length === 0 ? emptyMessage : "Ingen bestillinger passer søket eller filteret."}
                </TableCell>
              </TableRow>
            )}
            {visibleBookings.map((booking) => {
              const isExpanded = expandedId === booking.id;
              const fullName = `${booking.first_name} ${booking.last_name}`;

              return (
                <Fragment key={booking.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Skjul detaljer" : "Vis detaljer"}
                        onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                      >
                        <ChevronRight className={cn("size-4 transition-transform", isExpanded && "rotate-90")} />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatDate(booking.date)}
                      <span className="text-muted-foreground"> kl. {booking.time}</span>
                    </TableCell>
                    <TableCell>
                      <div>{fullName}</div>
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
                        <DeleteContentButton id={booking.id} label={fullName} action={deleteBooking} />
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="bg-muted/30 whitespace-normal">
                        <div className="grid gap-4 px-2 py-2 sm:grid-cols-2 lg:grid-cols-4">
                          <DetailRow label="Navn">{fullName}</DetailRow>
                          <DetailRow label="Telefon">
                            <a className="hover:underline" href={`tel:${booking.phone}`}>
                              {formatPhone(booking.phone)}
                            </a>
                          </DetailRow>
                          <DetailRow label="E-post">
                            <a className="break-all hover:underline" href={`mailto:${booking.email}`}>
                              {booking.email}
                            </a>
                          </DetailRow>
                          <DetailRow label="Behandling">{booking.service}</DetailRow>
                          <DetailRow label="Time">
                            {formatDate(booking.date)} kl. {booking.time}
                          </DetailRow>
                          <DetailRow label="Mottatt">{formatTimestamp(booking.created_at)}</DetailRow>
                          <DetailRow label="Bekreftet">{formatTimestamp(booking.confirmed_at)}</DetailRow>
                          <DetailRow label="Avbestilt">{formatTimestamp(booking.cancelled_at)}</DetailRow>
                          <div className="sm:col-span-2 lg:col-span-4">
                            <DetailRow label="Melding">{booking.message?.trim() || "—"}</DetailRow>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
