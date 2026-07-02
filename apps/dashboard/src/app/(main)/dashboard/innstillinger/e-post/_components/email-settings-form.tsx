"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveEmailSettings, sendTestEmail } from "@/server/content-actions";
import type { EmailSettings } from "@/types/content";

function isConfigured(settings: EmailSettings): boolean {
  return Boolean(settings.resend_api_key?.trim() && settings.email_from?.trim());
}

export function EmailSettingsForm({
  settings,
  defaultTestEmail,
}: {
  readonly settings: EmailSettings;
  readonly defaultTestEmail: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isTestPending, startTestTransition] = useTransition();
  const configured = isConfigured(settings);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveEmailSettings(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("E-postinnstillingene er lagret.");
      router.refresh();
    });
  };

  const onTestSend = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    startTestTransition(async () => {
      const result = await sendTestEmail(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Test e-post er sendt.");
    });
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>Resend</CardTitle>
            <Badge variant={configured ? "default" : "secondary"}>
              {configured ? "Aktiv" : "Ikke konfigurert"}
            </Badge>
          </div>
          <CardDescription>
            Bekreftelses-e-post for timebestillinger og kurspåmeldinger sendes via{" "}
            <a
              href="https://resend.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              Resend
            </a>
            . Du trenger et verifisert domene og en API-nøkkel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="resend_api_key">Resend API-nøkkel</FieldLabel>
              <Input
                id="resend_api_key"
                name="resend_api_key"
                type="password"
                autoComplete="off"
                placeholder={settings.resend_api_key ? "••••••••••••••••" : "re_…"}
              />
              <FieldDescription>
                {settings.resend_api_key
                  ? "La feltet stå tomt for å beholde nåværende nøkkel."
                  : "Finnes under API Keys i Resend-dashboardet."}
              </FieldDescription>
            </Field>

            {settings.resend_api_key ? (
              <Field orientation="horizontal" className="items-center gap-3">
                <Switch id="clear_resend_api_key" name="clear_resend_api_key" />
                <div>
                  <FieldLabel htmlFor="clear_resend_api_key" className="font-normal">
                    Fjern lagret API-nøkkel
                  </FieldLabel>
                  <FieldDescription>Slett nøkkelen fra databasen ved lagring.</FieldDescription>
                </div>
              </Field>
            ) : null}

            <Field className="gap-1.5">
              <FieldLabel htmlFor="email_from">Avsender</FieldLabel>
              <Input
                id="email_from"
                name="email_from"
                defaultValue={settings.email_from ?? ""}
                placeholder="Sandnes Soneterapi <booking@sandnessoneterapi.no>"
              />
              <FieldDescription>Format: Navn &lt;epost@domene.no&gt;</FieldDescription>
            </Field>

            <Field className="gap-1.5">
              <FieldLabel htmlFor="booking_admin_email">Kopi til Terje</FieldLabel>
              <Input
                id="booking_admin_email"
                name="booking_admin_email"
                type="email"
                defaultValue={settings.booking_admin_email ?? ""}
                placeholder="terje@sandnessoneterapi.no"
              />
              <FieldDescription>
                Valgfritt. Mottar kopi av nye timebestillinger og kurspåmeldinger.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test e-post</CardTitle>
          <CardDescription>
            Send en test for å bekrefte at API-nøkkel, avsender og domene fungerer. Bruker verdiene
            i skjemaet over, eller lagrede innstillinger hvis feltene er tomme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="gap-5">
            <Field className="gap-1.5">
              <FieldLabel htmlFor="test_email">Mottaker</FieldLabel>
              <Input
                id="test_email"
                name="test_email"
                type="email"
                defaultValue={defaultTestEmail}
                placeholder="din@epost.no"
              />
              <FieldDescription>E-postadressen som skal motta testmeldingen.</FieldDescription>
            </Field>
            <div>
              <Button type="button" variant="outline" disabled={isTestPending} onClick={onTestSend}>
                {isTestPending ? "Sender …" : "Send test e-post"}
              </Button>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Lagrer …" : "Lagre e-postinnstillinger"}
        </Button>
      </div>
    </form>
  );
}
