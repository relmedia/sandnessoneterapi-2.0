"use client";

import { useTransition } from "react";

import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setCourseRegistrationStatus } from "@/server/booking-actions";
import type { BookingStatus } from "@/types/booking";

export function RegistrationActions({
  id,
  status,
}: {
  readonly id: string;
  readonly status: BookingStatus;
}) {
  const [isPending, startTransition] = useTransition();

  const update = (next: BookingStatus, successMessage: string) => {
    startTransition(async () => {
      const result = await setCourseRegistrationStatus(id, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
    });
  };

  return (
    <div className="flex justify-end gap-1">
      {status === "pending" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => update("confirmed", "Påmeldingen er bekreftet.")}
        >
          <Check className="size-4" />
          Bekreft
        </Button>
      )}
      {status !== "cancelled" && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => update("cancelled", "Påmeldingen er avlyst.")}
        >
          <X className="size-4" />
          Avlys
        </Button>
      )}
      {status === "cancelled" && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => update("pending", "Påmeldingen er gjenåpnet som venter.")}
        >
          Gjenåpne
        </Button>
      )}
    </div>
  );
}
