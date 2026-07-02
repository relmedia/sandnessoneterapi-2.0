"use client";

import { useState, useTransition } from "react";

import { CalendarIcon, CalendarPlus, Pencil } from "lucide-react";
import { nb } from "react-day-picker/locale";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { deleteAvailabilityDay, saveAvailabilityDay } from "@/server/booking-actions";
import { BOOKING_TIME_SLOTS, type AvailabilityDay } from "@/types/booking";

import { DeleteContentButton } from "../../_components/delete-content-button";

function parseDate(value: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  const date = parseDate(value);
  if (!date) return value;
  const label = date.toLocaleDateString("nb-NO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function DatePicker({
  value,
  onChange,
  plannedDates,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly plannedDates: Date[];
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id="availability-date"
          type="button"
          variant="outline"
          className={cn("w-full justify-start font-normal", !selected && "text-muted-foreground")}
        >
          <CalendarIcon className="size-4" />
          <span>{selected ? formatDate(value) : "Velg dato"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={nb}
          weekStartsOn={1}
          captionLayout="dropdown"
          startMonth={startOfToday()}
          selected={selected}
          defaultMonth={selected ?? startOfToday()}
          disabled={{ before: startOfToday() }}
          modifiers={{ planned: plannedDates }}
          modifiersClassNames={{
            planned:
              "[&_button]:underline [&_button]:decoration-primary/60 [&_button]:decoration-2 [&_button]:underline-offset-4",
          }}
          onSelect={(date) => {
            onChange(date ? toIsoDate(date) : "");
            setOpen(false);
          }}
        />
        <div className="text-muted-foreground border-t px-3 py-2 text-xs">
          Understrekede dager er allerede lagt inn.
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AvailabilityManager({ days }: { readonly days: AvailabilityDay[] }) {
  const [date, setDate] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [slots, setSlots] = useState<string[]>([...BOOKING_TIME_SLOTS]);
  const [isPending, startTransition] = useTransition();

  const toggleSlot = (slot: string, checked: boolean) => {
    setSlots((prev) => (checked ? [...prev, slot].sort() : prev.filter((value) => value !== slot)));
  };

  const editDay = (day: AvailabilityDay) => {
    setDate(day.date);
    setIsClosed(day.is_closed);
    setSlots(day.is_closed ? [...BOOKING_TIME_SLOTS] : day.slots);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData();
    formData.set("date", date);
    if (isClosed) formData.set("is_closed", "on");
    for (const slot of slots) formData.append("slots", slot);

    startTransition(async () => {
      const result = await saveAvailabilityDay(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Dagen er lagret.");
      setDate("");
      setIsClosed(false);
      setSlots([...BOOKING_TIME_SLOTS]);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarPlus className="size-4" />
            Legg til eller endre dag
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="availability-date">Dato</Label>
                <DatePicker
                  value={date}
                  onChange={setDate}
                  plannedDates={days.map((day) => parseDate(day.date)).filter((d): d is Date => Boolean(d))}
                />
                <p className="text-muted-foreground text-xs">
                  Finnes datoen fra før, overskrives den med valgene under.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="availability-closed">Stengt for booking</Label>
                <div className="flex h-9 items-center gap-3">
                  <Switch id="availability-closed" checked={isClosed} onCheckedChange={setIsClosed} />
                  <span className="text-muted-foreground text-sm">
                    Skjuler dagen i kalenderen uten å slette den.
                  </span>
                </div>
              </div>
            </div>

            {!isClosed && (
              <div className="flex flex-col gap-2">
                <Label>Ledige klokkeslett</Label>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {BOOKING_TIME_SLOTS.map((slot) => (
                    <label key={slot} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={slots.includes(slot)}
                        onCheckedChange={(checked) => toggleSlot(slot, checked === true)}
                      />
                      {slot}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Button type="submit" disabled={isPending || !date}>
                {isPending ? "Lagrer …" : "Lagre dag"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dato</TableHead>
              <TableHead className="hidden md:table-cell">Klokkeslett</TableHead>
              <TableHead className="w-24 text-center">Status</TableHead>
              <TableHead className="w-28 text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                  Ingen ledige dager er lagt inn ennå. Legg til en dag over for å åpne for booking.
                </TableCell>
              </TableRow>
            )}
            {days.map((day) => (
              <TableRow key={day.id}>
                <TableCell className="font-medium">{formatDate(day.date)}</TableCell>
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
                    <Button variant="ghost" size="icon" aria-label="Rediger" onClick={() => editDay(day)}>
                      <Pencil className="size-4" />
                    </Button>
                    <DeleteContentButton id={day.id} label={formatDate(day.date)} action={deleteAvailabilityDay} />
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
