"use client";

import { Fragment, useMemo, useState } from "react";

import { ChevronRight, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DatedCourseRegistration } from "@/lib/bookings";
import { cn } from "@/lib/utils";
import { deleteCourseRegistration } from "@/server/booking-actions";
import type { BookingStatus } from "@/types/booking";

import { DeleteContentButton } from "../../_components/delete-content-button";

import { RegistrationActions } from "./registration-actions";

type StatusFilter = "all" | BookingStatus;

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Venter",
  confirmed: "Bekreftet",
  cancelled: "Avlyst",
};

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Alle statuser",
  pending: "Venter",
  confirmed: "Bekreftet",
  cancelled: "Avlyst",
};

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

function formatDay(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" });
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
  return phone;
}

function StatusBadge({ status }: { readonly status: BookingStatus }) {
  const variant = status === "confirmed" ? "default" : status === "cancelled" ? "outline" : "secondary";
  return <Badge variant={variant}>{STATUS_LABELS[status] ?? status}</Badge>;
}

function searchable(registration: DatedCourseRegistration): string {
  return [
    registration.first_name,
    registration.last_name,
    registration.email,
    registration.phone,
    formatPhone(registration.phone),
    registration.course_title,
    registration.session_label ?? "",
    registration.message ?? "",
    registration.course_date ?? "",
    formatDay(registration.course_date),
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

export function RegistrationTable({
  registrations,
  emptyMessage,
}: {
  readonly registrations: DatedCourseRegistration[];
  readonly emptyMessage: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const hasFilters = query.trim() !== "" || status !== "all";

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return registrations.filter((registration) => {
      if (needle && !searchable(registration).includes(needle)) return false;
      if (status !== "all" && registration.status !== status) return false;
      return true;
    });
  }, [registrations, query, status]);

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
            aria-label="Søk i påmeldinger"
            placeholder="Søk på navn, e-post, telefon eller kurs"
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
          Viser {visible.length} av {registrations.length}{" "}
          {registrations.length === 1 ? "påmelding" : "påmeldinger"}
        </span>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Kurs</TableHead>
              <TableHead>Navn</TableHead>
              <TableHead className="hidden lg:table-cell">Kontakt</TableHead>
              <TableHead className="hidden md:table-cell">Påmeldt</TableHead>
              <TableHead className="w-28 text-center">Status</TableHead>
              <TableHead className="w-56 text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                  {registrations.length === 0 ? emptyMessage : "Ingen påmeldinger passer søket eller filteret."}
                </TableCell>
              </TableRow>
            )}
            {visible.map((registration) => {
              const isExpanded = expandedId === registration.id;
              const fullName = `${registration.first_name} ${registration.last_name}`;

              return (
                <Fragment key={registration.id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Skjul detaljer" : "Vis detaljer"}
                        onClick={() => setExpandedId(isExpanded ? null : registration.id)}
                      >
                        <ChevronRight className={cn("size-4 transition-transform", isExpanded && "rotate-90")} />
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{registration.course_title}</div>
                      {registration.session_label && (
                        <p className="text-muted-foreground mt-0.5 text-xs font-normal">
                          {registration.session_label}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{fullName}</div>
                      {registration.message && (
                        <p
                          className="text-muted-foreground mt-0.5 max-w-72 truncate text-xs"
                          title={registration.message}
                        >
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
                      {formatDay(registration.created_at.slice(0, 10))}
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={registration.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <RegistrationActions id={registration.id} status={registration.status} />
                        <DeleteContentButton
                          id={registration.id}
                          label={fullName}
                          action={deleteCourseRegistration}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="bg-muted/30 whitespace-normal">
                        <div className="grid gap-4 px-2 py-2 sm:grid-cols-2 lg:grid-cols-4">
                          <DetailRow label="Navn">{fullName}</DetailRow>
                          <DetailRow label="Telefon">
                            <a className="hover:underline" href={`tel:${registration.phone}`}>
                              {formatPhone(registration.phone)}
                            </a>
                          </DetailRow>
                          <DetailRow label="E-post">
                            <a className="break-all hover:underline" href={`mailto:${registration.email}`}>
                              {registration.email}
                            </a>
                          </DetailRow>
                          <DetailRow label="Kurs">{registration.course_title}</DetailRow>
                          <DetailRow label="Kursdato">{registration.session_label ?? "—"}</DetailRow>
                          <DetailRow label="Kurset slutter">{formatDay(registration.course_date)}</DetailRow>
                          <DetailRow label="Påmeldt">{formatTimestamp(registration.created_at)}</DetailRow>
                          <DetailRow label="Avlyst">{formatTimestamp(registration.cancelled_at)}</DetailRow>
                          <div className="sm:col-span-2 lg:col-span-4">
                            <DetailRow label="Melding">{registration.message?.trim() || "—"}</DetailRow>
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
