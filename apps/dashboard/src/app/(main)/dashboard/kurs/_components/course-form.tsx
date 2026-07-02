"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CalendarPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DatePicker } from "@/components/admin/date-picker-field";
import { ImagePicker } from "@/components/admin/image-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { bodyToHtml } from "@/lib/format";
import { saveCourse } from "@/server/content-actions";
import type { Course } from "@/types/content";

// Time slots 08:00–16:00 in 30-minute steps
const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 16; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 16) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

function TimeSelect({
  value,
  onChange,
  placeholder = "Velg tid",
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm",
        "transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        !value && "text-muted-foreground",
      )}
    >
      <option value="">{placeholder}</option>
      {TIME_SLOTS.map((slot) => (
        <option key={slot} value={slot}>
          {slot}
        </option>
      ))}
    </select>
  );
}

type SessionRow = { start: string; end: string; startTime: string; endTime: string; capacity: string };

const EMPTY_ROW: SessionRow = { start: "", end: "", startTime: "", endTime: "", capacity: "" };

function initialSessions(course: Course | null): SessionRow[] {
  if (course?.sessions && course.sessions.length > 0) {
    return course.sessions.map((session) => ({
      start: session.start,
      end: session.end ?? "",
      startTime: session.start_time ?? "",
      endTime: session.end_time ?? "",
      capacity: session.capacity != null ? String(session.capacity) : "",
    }));
  }
  if (course?.start_date) {
    return [{ ...EMPTY_ROW, start: course.start_date, end: course.end_date ?? "" }];
  }
  return [{ ...EMPTY_ROW }];
}

export function CourseForm({ course }: { readonly course: Course | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sessions, setSessions] = useState<SessionRow[]>(() => initialSessions(course));

  const updateSession = (index: number, patch: Partial<SessionRow>) => {
    setSessions((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeSession = (index: number) => {
    setSessions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [{ ...EMPTY_ROW }]));
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveCourse(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Kurset er lagret.");
      router.push("/dashboard/kurs");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {course && <input type="hidden" name="id" value={course.id} />}
      <FieldGroup className="gap-5">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="title">Tittel</FieldLabel>
          <Input id="title" name="title" defaultValue={course?.title ?? ""} required />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="slug">URL-slug</FieldLabel>
          <Input id="slug" name="slug" defaultValue={course?.slug ?? ""} placeholder="genereres fra tittel" />
          <FieldDescription>La stå tom for å generere automatisk fra tittelen.</FieldDescription>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="short_description">Kort beskrivelse</FieldLabel>
          <Textarea
            id="short_description"
            name="short_description"
            rows={3}
            defaultValue={course?.short_description ?? ""}
          />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>Utfyllende tekst</FieldLabel>
          <RichTextEditor name="body" defaultValue={bodyToHtml(course?.body)} />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>Bilde</FieldLabel>
          <ImagePicker name="image_url" defaultValue={course?.image_url ?? ""} />
          <FieldDescription>Vises på kurskortet (valgfritt).</FieldDescription>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>Kursdatoer</FieldLabel>
          <input
            type="hidden"
            name="sessions"
            value={JSON.stringify(
              sessions
                .filter((row) => row.start)
                .map((row) => ({
                  start: row.start,
                  end: row.end || null,
                  start_time: row.startTime || null,
                  end_time: row.endTime || null,
                  capacity: row.capacity ? Number(row.capacity) : null,
                })),
            )}
          />
          <div className="flex flex-col gap-4">
            {sessions.map((row, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="rounded-lg border p-3 flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted-foreground text-xs">Startdato</span>
                    <DatePicker
                      value={row.start}
                      onChange={(value) => updateSession(index, { start: value })}
                      placeholder="Velg dato"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted-foreground text-xs">Sluttdato (valgfritt)</span>
                    <DatePicker
                      value={row.end}
                      onChange={(value) => updateSession(index, { end: value })}
                      placeholder="Velg dato"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted-foreground text-xs">Starttid (valgfritt)</span>
                    <TimeSelect
                      value={row.startTime}
                      onChange={(value) => updateSession(index, { startTime: value })}
                      placeholder="Velg starttid"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted-foreground text-xs">Sluttid (valgfritt)</span>
                    <TimeSelect
                      value={row.endTime}
                      onChange={(value) => updateSession(index, { endTime: value })}
                      placeholder="Velg sluttid"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-muted-foreground text-xs">Antall plasser</span>
                    <Input
                      type="number"
                      min={1}
                      value={row.capacity}
                      onChange={(e) => updateSession(index, { capacity: e.target.value })}
                      placeholder="12"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-7 gap-1.5"
                    onClick={() => removeSession(index)}
                  >
                    <Trash2 className="size-3.5" />
                    Fjern
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setSessions((prev) => [...prev, { ...EMPTY_ROW }])}
            >
              <CalendarPlus className="size-4" />
              Legg til dato
            </Button>
          </div>
          <FieldDescription>
            Legg til én eller flere kursdatoer (f.eks. flere helger). Deltakeren velger dato ved påmelding.
          </FieldDescription>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="price">Pris (kr)</FieldLabel>
            <Input id="price" name="price" type="number" defaultValue={course?.price ?? ""} placeholder="6000" />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="location">Sted</FieldLabel>
            <Input
              id="location"
              name="location"
              defaultValue={course?.location ?? ""}
              placeholder="Industrigata 1, Sandnes"
            />
          </Field>
        </div>
        <Field orientation="horizontal" className="items-center gap-3">
          <Switch id="active" name="active" defaultChecked={course?.active ?? true} />
          <FieldLabel htmlFor="active" className="font-normal">
            Vis kurset på nettsiden
          </FieldLabel>
        </Field>
      </FieldGroup>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Lagrer …" : "Lagre"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/kurs">Avbryt</Link>
        </Button>
      </div>
    </form>
  );
}
