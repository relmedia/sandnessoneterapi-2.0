"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import { Check, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

export function ConsentSwitch({
  className,
  disabled,
  ...props
}: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="consent-switch"
      disabled={disabled}
      className={cn(
        "group/consent-switch relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border p-1 transition-[background-color,border-color,box-shadow] duration-300 ease-out outline-none",
        "focus-visible:ring-2 focus-visible:ring-sage/35 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        "data-checked:border-sage/30 data-checked:bg-sage data-checked:shadow-[inset_0_1px_2px_rgba(61,53,48,0.12)]",
        "data-unchecked:border-stone/15 data-unchecked:bg-stone/12 data-unchecked:shadow-[inset_0_1px_2px_rgba(61,53,48,0.06)]",
        "data-disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="consent-switch-thumb"
        className={cn(
          "pointer-events-none flex size-6 items-center justify-center rounded-full bg-cream shadow-[0_1px_3px_rgba(61,53,48,0.18),0_0_0_1px_rgba(61,53,48,0.06)] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
          "group-data-checked/consent-switch:translate-x-6 group-data-unchecked/consent-switch:translate-x-0",
          disabled && "bg-sage-light shadow-[0_1px_2px_rgba(61,53,48,0.12)]",
        )}
      >
        {disabled ? (
          <Lock className="size-3 text-sage-dark" aria-hidden="true" />
        ) : (
          <Check
            className="size-3 text-sage-dark opacity-0 transition-opacity duration-200 group-data-checked/consent-switch:opacity-100"
            aria-hidden="true"
          />
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}
