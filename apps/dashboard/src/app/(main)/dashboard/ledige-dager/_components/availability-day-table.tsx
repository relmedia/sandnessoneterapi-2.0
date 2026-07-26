"use client";

import { useMemo, useState } from "react";

import { CalendarIcon, Pencil } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { nb } from "react-day-picker/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAvailabilityDate, formatShortDate, toIsoDate } from "@/lib/availability";
import { cn } from "@/lib/utils";
import { deleteAvailabilityDay } from "@/server/booking-actions";
import { BOOKING_TIME_SLOTS, type AvailabilityDay } from "@/types/booking";

import { DeleteContentButton } from "../../_components/delete-content-button";

type StatusFilter = "all" | "open" | "closed";

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "Alle statuser",
  open: "Åpne",
  closed: "Stengte",
};

function DateRangeFilter({
  range,
  onChange,
}: {
  readonly range: DateRange | undefined;
  readonly onChange: (range: DateRange | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const label = range?.from
    ? range.to && toIsoDate(range.to) !== toIsoDate(range.from)
      ? `${formatShortDate(toIsoDate(range.from))} – ${formatShortDate(toIsoDate(range.to))}`
      : formatShortDate(toIsoDate(range.from))
    : "Alle datoer";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label="Filtrer på dato"
          className={cn("h-9 w-full justify-start font-normal sm:w-64", !range?.from && "text-muted-foreground")}
        >
          <CalendarIcon className="size-4" />
          <span>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          locale={nb}
          weekStartsOn={1}
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)}
          endMonth={new Date(currentYear + 5, 11)}
          numberOfMonths={2}
          selected={range}
          defaultMonth={range?.from}
          onSelect={onChange}
        />
        <div className="text-muted-foreground border-t px-3 py-2 text-xs">
          Velg én dag, eller klikk to ganger for en periode.
        </div>
        {range?.from && (
          <div className="border-t px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground h-7 w-full"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              Fjern datofilter
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function AvailabilityDayTable({
  days,
  emptyMessage,
  onEdit,
}: {
  readonly days: AvailabilityDay[];
  readonly emptyMessage: string;
  readonly onEdit?: (day: AvailabilityDay) => void;
}) {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [slot, setSlot] = useState("all");

  const hasFilters = Boolean(range?.from) || status !== "all" || slot !== "all";

  const visibleDays = useMemo(() => {
    // An open-ended range (only a start picked) filters to that single day.
    const from = range?.from ? toIsoDate(range.from) : null;
    const to = range?.to ? toIsoDate(range.to) : from;

    return days.filter((day) => {
      if (from && (day.date < from || (to && day.date > to))) return false;
      if (status === "open" && day.is_closed) return false;
      if (status === "closed" && !day.is_closed) return false;
      if (slot !== "all" && !day.slots.includes(slot)) return false;
      return true;
    });
  }, [days, range, status, slot]);

  const resetFilters = () => {
    setRange(undefined);
    setStatus("all");
    setSlot("all");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <DateRangeFilter range={range} onChange={setRange} />

        <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
          <SelectTrigger aria-label="Filtrer på status" className="h-9 w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((value) => (
              <SelectItem key={value} value={value}>
                {STATUS_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={slot} onValueChange={setSlot}>
          <SelectTrigger aria-label="Filtrer på klokkeslett" className="h-9 w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle klokkeslett</SelectItem>
            {BOOKING_TIME_SLOTS.map((value) => (
              <SelectItem key={value} value={value}>
                Ledig kl. {value}
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
          Viser {visibleDays.length} av {days.length} {days.length === 1 ? "dag" : "dager"}
        </span>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dato</TableHead>
              <TableHead className="hidden md:table-cell">Klokkeslett</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
              <TableHead className={onEdit ? "w-28 text-right" : "w-16 text-right"}>Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleDays.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                  {days.length === 0 ? emptyMessage : "Ingen dager passer filtrene."}
                </TableCell>
              </TableRow>
            )}
            {visibleDays.map((day) => (
              <TableRow key={day.id}>
                <TableCell className="font-medium">{formatAvailabilityDate(day.date)}</TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">
                  {day.is_closed ? "—" : day.slots.join(", ")}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={day.is_closed ? "outline" : "default"}>
                    {day.is_closed ? "Stengt" : `${day.slots.length} tider`}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {onEdit && (
                      <Button variant="ghost" size="icon" aria-label="Rediger" onClick={() => onEdit(day)}>
                        <Pencil className="size-4" />
                      </Button>
                    )}
                    <DeleteContentButton
                      id={day.id}
                      label={formatAvailabilityDate(day.date)}
                      action={deleteAvailabilityDay}
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
