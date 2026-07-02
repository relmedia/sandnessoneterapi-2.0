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

const formSchema = z.object({
  firstName: z.string().trim().min(1, { message: "Skriv inn fornavn." }),
  lastName: z.string().trim().min(1, { message: "Skriv inn etternavn." }),
});

type ProfileValues = z.infer<typeof formSchema>;

export function ProfileForm({
  initialFirstName,
  initialLastName,
}: {
  readonly initialFirstName: string;
  readonly initialLastName: string;
}) {
  const router = useRouter();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: initialFirstName,
      lastName: initialLastName,
    },
  });

  const onSubmit = async (data: ProfileValues) => {
    const supabase = createClient();

    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const { error } = await supabase.auth.updateUser({
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        name: fullName,
      },
    });

    if (error) {
      toast.error(error.message || "Kunne ikke oppdatere navnet.");
      return;
    }

    form.reset(data);
    toast.success("Navnet er oppdatert.");
    router.refresh();
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4 sm:flex-row">
        <Controller
          control={form.control}
          name="firstName"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="first-name">Fornavn</FieldLabel>
              <Input
                {...field}
                id="first-name"
                type="text"
                placeholder="Fornavn"
                autoComplete="given-name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="lastName"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="last-name">Etternavn</FieldLabel>
              <Input
                {...field}
                id="last-name"
                type="text"
                placeholder="Etternavn"
                autoComplete="family-name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Lagrer …" : "Lagre navn"}
        </Button>
      </div>
    </form>
  );
}
