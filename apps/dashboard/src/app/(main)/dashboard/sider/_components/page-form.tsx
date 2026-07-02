"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { toast } from "sonner";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { savePage } from "@/server/content-actions";
import type { Page } from "@/types/content";

export function PageForm({ page }: { readonly page: Page | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await savePage(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Siden er lagret.");
      router.push("/dashboard/sider");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {page && <input type="hidden" name="id" value={page.id} />}
      <FieldGroup className="gap-5">
        <Field className="gap-1.5">
          <FieldLabel htmlFor="title">Tittel</FieldLabel>
          <Input id="title" name="title" defaultValue={page?.title ?? ""} required />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="slug">URL-slug</FieldLabel>
          <Input id="slug" name="slug" defaultValue={page?.slug ?? ""} placeholder="genereres fra tittel" />
          <FieldDescription>Adressen siden vises på, f.eks. «om-meg» → /om-meg.</FieldDescription>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel>Innhold</FieldLabel>
          <RichTextEditor name="body" defaultValue={page?.body ?? ""} />
        </Field>
      </FieldGroup>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Lagrer …" : "Lagre"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/sider">Avbryt</Link>
        </Button>
      </div>
    </form>
  );
}
