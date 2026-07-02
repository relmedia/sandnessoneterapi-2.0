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
import { Textarea } from "@/components/ui/textarea";
import { saveArticle } from "@/server/content-actions";
import type { Article } from "@/types/content";

export function ArticleForm({ article }: { readonly article: Article | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const publishedDate = article?.published_at ? article.published_at.slice(0, 10) : "";

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveArticle(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Artikkelen er lagret.");
      router.push("/dashboard/artikler");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {article && <input type="hidden" name="id" value={article.id} />}
      <FieldGroup className="gap-5">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="title">Tittel</FieldLabel>
          <Input id="title" name="title" defaultValue={article?.title ?? ""} required />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="slug">URL-slug</FieldLabel>
            <Input id="slug" name="slug" defaultValue={article?.slug ?? ""} placeholder="genereres fra tittel" />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel htmlFor="published_at">Publisert</FieldLabel>
            <DatePickerField id="published_at" name="published_at" defaultValue={publishedDate} />
          </Field>
        </div>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="excerpt">Ingress</FieldLabel>
          <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={article?.excerpt ?? ""} />
          <FieldDescription>Kort sammendrag som vises i artikkellisten.</FieldDescription>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>Bilde</FieldLabel>
          <ImagePicker name="cover_image_url" defaultValue={article?.cover_image_url ?? ""} />
          <FieldDescription>Last opp et bilde eller velg fra biblioteket (valgfritt).</FieldDescription>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>Innhold</FieldLabel>
          <RichTextEditor name="body" defaultValue={article?.body ?? ""} />
        </Field>
      </FieldGroup>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Lagrer …" : "Lagre"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/artikler">Avbryt</Link>
        </Button>
      </div>
    </form>
  );
}
