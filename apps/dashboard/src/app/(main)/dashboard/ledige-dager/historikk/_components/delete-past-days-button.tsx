"use client";

import { useTransition } from "react";

import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deletePastAvailabilityDays } from "@/server/booking-actions";

export function DeletePastDaysButton({ count }: { readonly count: number }) {
  const [isPending, startTransition] = useTransition();

  const onConfirm = () => {
    startTransition(async () => {
      const result = await deletePastAvailabilityDays();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(result.deleted === 1 ? "1 dag er slettet." : `${result.deleted} dager er slettet.`);
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <Trash2 className="size-4 text-destructive" />
          Tøm historikken
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {count === 1 ? "Slette 1 tidligere dag?" : `Slette ${count} tidligere dager?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Dette kan ikke angres. Kommende dager og timebestillinger blir ikke berørt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? "Sletter …" : "Slett alle"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
