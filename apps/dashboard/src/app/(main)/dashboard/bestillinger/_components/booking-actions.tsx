"use client";

import { useTransition } from "react";

import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { setBookingStatus } from "@/server/booking-actions";
import type { BookingStatus } from "@/types/booking";

export function BookingActions({
  id,
  status,
}: {
  readonly id: string;
  readonly status: BookingStatus;
}) {
  const [isPending, startTransition] = useTransition();

  const update = (next: BookingStatus, successMessage: string) => {
    startTransition(async () => {
      const result = await setBookingStatus(id, next);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        next === "confirmed"
          ? "Timen er bekreftet. Kunden har fått e-post hvis e-post er konfigurert."
          : successMessage,
      );
    });
  };

  return (
    <div className="flex justify-end gap-1">
      {status === "pending" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => update("confirmed", "Timen er bekreftet.")}
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
          onClick={() => update("cancelled", "Timen er avbestilt.")}
        >
          <X className="size-4" />
          Avbestill
        </Button>
      )}
      {status === "cancelled" && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => update("pending", "Timen er gjenåpnet som venter.")}
        >
          Gjenåpne
        </Button>
      )}
    </div>
  );
}
