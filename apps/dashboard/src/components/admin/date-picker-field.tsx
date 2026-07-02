"use client";

import { useState } from "react";

import { CalendarIcon } from "lucide-react";
import { nb } from "react-day-picker/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Velg dato",
}: {
  readonly id?: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn("w-full justify-start font-normal", !selected && "text-muted-foreground")}
          >
            <CalendarIcon className="size-4" />
            <span>{selected ? formatDate(value) : placeholder}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={nb}
            weekStartsOn={1}
            captionLayout="dropdown"
            startMonth={new Date(1980, 0)}
            endMonth={new Date(currentYear + 5, 11)}
            selected={selected}
            defaultMonth={selected ?? new Date()}
            onSelect={(date) => {
              onChange(date ? toIsoDate(date) : "");
              setOpen(false);
            }}
          />
          {value && (
            <div className="border-t px-3 py-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground h-7 w-full"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                Fjern dato
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </>
  );
}

export function DatePickerField({
  id,
  name,
  defaultValue = "",
  placeholder = "Velg dato",
}: {
  readonly id?: string;
  readonly name: string;
  readonly defaultValue?: string;
  readonly placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <DatePicker id={id} value={value} onChange={setValue} placeholder={placeholder} />
    </>
  );
}
