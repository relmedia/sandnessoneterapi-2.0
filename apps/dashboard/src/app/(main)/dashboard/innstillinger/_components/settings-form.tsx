"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { saveSettings } from "@/server/content-actions";
import type { SiteSettings } from "@/types/content";

export function SettingsForm({ settings }: { readonly settings: SiteSettings }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveSettings(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Innstillingene er lagret.");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={settings.id} />

      <Card>
        <CardHeader>
          <CardTitle>Generelt</CardTitle>
          <CardDescription>Navn og slagord for nettstedet.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="title">Tittel</FieldLabel>
              <Input id="title" name="title" defaultValue={settings.title ?? ""} />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="tagline">Slagord</FieldLabel>
              <Input id="tagline" name="tagline" defaultValue={settings.tagline ?? ""} />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="meta_description">Meta-beskrivelse (SEO)</FieldLabel>
              <Textarea
                id="meta_description"
                name="meta_description"
                rows={2}
                defaultValue={settings.meta_description ?? ""}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Forside (hero)</CardTitle>
          <CardDescription>Den store overskriften og teksten øverst på nettsiden.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="hero_heading">Overskrift</FieldLabel>
              <Input id="hero_heading" name="hero_heading" defaultValue={settings.hero_heading ?? ""} />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="hero_body">Ingress</FieldLabel>
              <Textarea id="hero_body" name="hero_body" rows={3} defaultValue={settings.hero_body ?? ""} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kontaktinformasjon</CardTitle>
          <CardDescription>Vises i bunnteksten og kontaktseksjonen.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field className="gap-1.5">
                <FieldLabel htmlFor="phone">Telefon</FieldLabel>
                <Input id="phone" name="phone" defaultValue={settings.phone ?? ""} />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel htmlFor="email">E-post</FieldLabel>
                <Input id="email" name="email" type="email" defaultValue={settings.email ?? ""} />
              </Field>
            </div>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="address">Adresse</FieldLabel>
              <Input id="address" name="address" defaultValue={settings.address ?? ""} />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel htmlFor="facebook_url">Facebook-URL</FieldLabel>
              <Input id="facebook_url" name="facebook_url" defaultValue={settings.facebook_url ?? ""} />
            </Field>
            <Field orientation="horizontal" className="items-center gap-3">
              <Switch id="nnh" name="nnh" defaultChecked={settings.nnh ?? false} />
              <div>
                <FieldLabel htmlFor="nnh" className="font-normal">
                  NNH-godkjent
                </FieldLabel>
                <FieldDescription>Viser «Godkjent av NNH»-merket på nettsiden.</FieldDescription>
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Lagrer …" : "Lagre innstillinger"}
        </Button>
      </div>
    </form>
  );
}
