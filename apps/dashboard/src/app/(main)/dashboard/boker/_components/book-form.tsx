"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { toast } from "sonner";

import { DatePickerField } from "@/components/admin/date-picker-field";
import { ImagePicker } from "@/components/admin/image-picker";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveBook } from "@/server/content-actions";
import type { Book } from "@/types/content";

export function BookForm({ book }: { readonly book: Book | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveBook(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Boken er lagret.");
      router.push("/dashboard/boker");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {book && <input type="hidden" name="id" value={book.id} />}
      <FieldGroup className="gap-5">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="title">Tittel</FieldLabel>
          <Input id="title" name="title" defaultValue={book?.title ?? ""} required />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="slug">URL-slug</FieldLabel>
          <Input id="slug" name="slug" defaultValue={book?.slug ?? ""} placeholder="genereres fra tittel" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="isbn">ISBN</FieldLabel>
            <Input id="isbn" name="isbn" defaultValue={book?.isbn ?? ""} />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="published_date">Utgitt</FieldLabel>
            <DatePickerField id="published_date" name="published_date" defaultValue={book?.published_date ?? ""} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="price">Pris (kr)</FieldLabel>
            <Input id="price" name="price" type="number" defaultValue={book?.price ?? ""} />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="pages">Antall sider</FieldLabel>
            <Input id="pages" name="pages" type="number" defaultValue={book?.pages ?? ""} />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="order">Rekkefølge</FieldLabel>
            <Input id="order" name="order" type="number" defaultValue={book?.order ?? 0} />
          </Field>
        </div>
        <Field className="flex flex-row items-center justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-0.5">
            <FieldLabel htmlFor="order_online">Kjøp med Vipps</FieldLabel>
            <FieldDescription>
              Vis «Kjøp med Vipps» på nettsiden når boken har pris satt.
            </FieldDescription>
          </div>
          <Switch
            id="order_online"
            name="order_online"
            defaultChecked={book?.order_online ?? Boolean(book?.price && book.price > 0)}
          />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>Omslagsbilde</FieldLabel>
          <ImagePicker name="cover_image_url" defaultValue={book?.cover_image_url ?? ""} />
          <FieldDescription>Last opp et bilde eller velg fra biblioteket (valgfritt).</FieldDescription>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>Beskrivelse</FieldLabel>
          <RichTextEditor name="description" defaultValue={book?.description ?? ""} />
        </Field>
      </FieldGroup>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Lagrer …" : "Lagre"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/boker">Avbryt</Link>
        </Button>
      </div>
    </form>
  );
}
