import { getSettings } from "@/lib/content";

import { SettingsForm } from "./_components/settings-form";

export default async function InnstillingerPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Nettside</h1>
        <p className="text-muted-foreground text-sm">Tekst og kontaktinformasjon som vises på nettsiden.</p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
