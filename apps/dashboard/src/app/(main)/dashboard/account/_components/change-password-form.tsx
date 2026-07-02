"use client";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const formSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Skriv inn nåværende passord." }),
    newPassword: z.string().min(8, { message: "Nytt passord må være minst 8 tegn." }),
    confirmPassword: z.string().min(1, { message: "Bekreft det nye passordet." }),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passordene er ikke like.",
  });

type ChangePasswordValues = z.infer<typeof formSchema>;

export function ChangePasswordForm({ email }: { readonly email: string }) {
  const router = useRouter();

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordValues) => {
    const supabase = createClient();

    // Re-authenticate with the current password before allowing a change.
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email,
      password: data.currentPassword,
    });

    if (reauthError) {
      form.setError("currentPassword", { message: "Nåværende passord er feil." });
      toast.error("Nåværende passord er feil.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword,
    });

    if (updateError) {
      toast.error(updateError.message || "Kunne ikke oppdatere passordet.");
      return;
    }

    form.reset();
    toast.success("Passordet er oppdatert.");
    router.refresh();
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="current-password">Nåværende passord</FieldLabel>
              <Input
                {...field}
                id="current-password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="new-password">Nytt passord</FieldLabel>
              <Input
                {...field}
                id="new-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="confirm-password">Bekreft nytt passord</FieldLabel>
              <Input
                {...field}
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Oppdaterer …" : "Oppdater passord"}
        </Button>
      </div>
    </form>
  );
}
