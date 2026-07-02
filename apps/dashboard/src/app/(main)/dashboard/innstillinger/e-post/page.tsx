import { getEmailSettings } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

import { EmailSettingsForm } from "./_components/email-settings-form";

export default async function EmailSettingsPage() {
  const supabase = await createClient();
  const [{ data: { user } }, settings] = await Promise.all([
    supabase.auth.getUser(),
    getEmailSettings(),
  ]);

  const defaultTestEmail = settings.booking_admin_email ?? user?.email ?? "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">E-post</h1>
        <p className="text-muted-foreground text-sm">
          Konfigurer Resend for bekreftelses-e-post ved timebestilling og kurspåmelding.
        </p>
      </div>

      <EmailSettingsForm settings={settings} defaultTestEmail={defaultTestEmail} />
    </div>
  );
}
