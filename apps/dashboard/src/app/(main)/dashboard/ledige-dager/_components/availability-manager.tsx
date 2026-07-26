"use client";

import { useState, useTransition } from "react";

import { CalendarIcon, CalendarPlus } from "lucide-react";
import { nb } from "react-day-picker/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AVAILABILITY_SCOPES,
  AVAILABILITY_SCOPE_LABELS,
  expandAvailabilityDates,
  formatAvailabilityDate as formatDate,
  formatShortDate,
  parseAvailabilityDate as parseDate,
  startOfToday,
  toIsoDate,
  todayInOslo,
  type AvailabilityScope,
} from "@/lib/availability";
import { cn } from "@/lib/utils";
import { saveAvailabilityDay } from "@/server/booking-actions";
import { BOOKING_TIME_SLOTS, type AvailabilityDay } from "@/types/booking";

import { AvailabilityDayTable } from "./availability-day-table";

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
  const [scope, setScope] = useState<AvailabilityScope>("day");
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [slots, setSlots] = useState<string[]>([...BOOKING_TIME_SLOTS]);
  const [isPending, startTransition] = useTransition();

  // Same expansion the server action performs, so the form can preview it.
  const periodDates = date ? expandAvailabilityDates(date, scope, { skipWeekends }) : [];
  const targetDates = periodDates.filter((value) => value >= todayInOslo());
  const skippedPast = periodDates.length - targetDates.length;

  const toggleSlot = (slot: string, checked: boolean) => {
    setSlots((prev) => (checked ? [...prev, slot].sort() : prev.filter((value) => value !== slot)));
  };

  const editDay = (day: AvailabilityDay) => {
    setDate(day.date);
    setIsClosed(day.is_closed);
    setScope("day");
    setSlots(day.is_closed ? [...BOOKING_TIME_SLOTS] : day.slots);
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData();
    formData.set("date", date);
    formData.set("scope", scope);
    if (isClosed) formData.set("is_closed", "on");
    if (skipWeekends) formData.set("skip_weekends", "on");
    for (const slot of slots) formData.append("slots", slot);

    startTransition(async () => {
      const result = await saveAvailabilityDay(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.saved === 1 ? "Dagen er lagret." : `${result.saved} dager er lagret.`);
      setDate("");
      setIsClosed(false);
      setScope("day");
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
                  Datoer som finnes fra før, overskrives med valgene under.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="availability-scope">Gjelder for</Label>
                <Select value={scope} onValueChange={(value) => setScope(value as AvailabilityScope)}>
                  <SelectTrigger id="availability-scope" className="h-9 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_SCOPES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {AVAILABILITY_SCOPE_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {scope === "day" ? (
                  <p className="text-muted-foreground text-xs">Lagrer bare den valgte datoen.</p>
                ) : (
                  <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-xs">
                    <Checkbox
                      checked={skipWeekends}
                      onCheckedChange={(checked) => setSkipWeekends(checked === true)}
                    />
                    Hopp over helger
                  </label>
                )}
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

            {date && scope !== "day" && (
              <p className="text-muted-foreground bg-muted/50 rounded-md px-3 py-2 text-xs">
                {targetDates.length === 0 ? (
                  "Ingen dager i perioden. Slå av «Hopp over helger», eller velg en annen dato."
                ) : (
                  <>
                    Lagres for {targetDates.length} {targetDates.length === 1 ? "dag" : "dager"}:{" "}
                    {formatShortDate(targetDates[0])} – {formatShortDate(targetDates[targetDates.length - 1])}.
                    {skippedPast > 0 &&
                      ` ${skippedPast} ${skippedPast === 1 ? "dag" : "dager"} som har passert, hoppes over.`}
                  </>
                )}
              </p>
            )}

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
              <Button type="submit" disabled={isPending || !date || targetDates.length === 0}>
                {isPending ? "Lagrer …" : targetDates.length > 1 ? `Lagre ${targetDates.length} dager` : "Lagre dag"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AvailabilityDayTable
        days={days}
        onEdit={editDay}
        emptyMessage="Ingen kommende dager er lagt inn. Legg til en dag over for å åpne for booking."
      />
    </div>
  );
}
