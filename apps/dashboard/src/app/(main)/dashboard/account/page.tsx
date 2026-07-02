import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { ChangePasswordForm } from "./_components/change-password-form";
import { ProfileForm } from "./_components/profile-form";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/studio");
  }

  const metadata = user.user_metadata ?? {};
  const fullName = (metadata.name as string | undefined) ?? "";
  const [derivedFirst, ...derivedRest] = fullName.split(" ");
  const initialFirstName = (metadata.first_name as string | undefined) ?? derivedFirst ?? "";
  const initialLastName = (metadata.last_name as string | undefined) ?? derivedRest.join(" ");

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Konto</h1>
        <p className="text-muted-foreground text-sm">Administrer innloggingen din.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Navnet ditt vises i administrasjonspanelet.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initialFirstName={initialFirstName} initialLastName={initialLastName} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kontoinformasjon</CardTitle>
          <CardDescription>Du er logget inn som denne brukeren.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">E-postadresse</span>
            <span className="font-medium">{user.email}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endre passord</CardTitle>
          <CardDescription>Bekreft det nåværende passordet ditt og velg et nytt.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm email={user.email ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
