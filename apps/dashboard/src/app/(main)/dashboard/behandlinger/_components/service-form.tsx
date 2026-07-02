"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { toast } from "sonner";

import { ImagePicker } from "@/components/admin/image-picker";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveService } from "@/server/content-actions";
import type { Service } from "@/types/content";

export function ServiceForm({ service }: { readonly service: Service | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveService(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Behandlingen er lagret.");
      router.push("/dashboard/behandlinger");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {service && <input type="hidden" name="id" value={service.id} />}
      <FieldGroup className="gap-5">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="title">Tittel</FieldLabel>
          <Input id="title" name="title" defaultValue={service?.title ?? ""} required />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="slug">URL-slug</FieldLabel>
          <Input id="slug" name="slug" defaultValue={service?.slug ?? ""} placeholder="genereres fra tittel" />
          <FieldDescription>La stå tom for å generere automatisk fra tittelen.</FieldDescription>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="short_description">Kort beskrivelse</FieldLabel>
          <Textarea
            id="short_description"
            name="short_description"
            rows={3}
            defaultValue={service?.short_description ?? ""}
          />
          <FieldDescription>Vises på forsiden i behandlingskortet.</FieldDescription>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="body">Utfyllende tekst</FieldLabel>
          <Textarea id="body" name="body" rows={6} defaultValue={service?.body ?? ""} />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>Bilde</FieldLabel>
          <ImagePicker name="image_url" defaultValue={service?.image_url ?? ""} />
          <FieldDescription>Last opp et bilde eller velg fra biblioteket (valgfritt).</FieldDescription>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="image_alt">Bildebeskrivelse (alt-tekst)</FieldLabel>
            <Input id="image_alt" name="image_alt" defaultValue={service?.image_alt ?? ""} />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="order">Rekkefølge</FieldLabel>
            <Input id="order" name="order" type="number" defaultValue={service?.order ?? 0} />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Lagrer …" : "Lagre"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/behandlinger">Avbryt</Link>
        </Button>
      </div>
    </form>
  );
}
