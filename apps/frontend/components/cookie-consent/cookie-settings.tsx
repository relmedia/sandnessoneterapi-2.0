"use client"

import * as React from "react"
import { Check, Shield } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ConsentSwitch } from "./consent-switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCookieConsent, defaultCategories } from "./cookie-provider"
import type { ConsentCategories, ConsentCategory } from "./types"
import { getDefaultCategories, getAllAcceptedCategories } from "./utils"
import { cn } from "@/lib/utils"

export interface CookieSettingsProps {
  className?: string
}

export function CookieSettings({ className }: CookieSettingsProps) {
  const { isSettingsOpen, closeSettings, state, updateConsent, config, acceptAll, rejectAll } = useCookieConsent()

  const categories = config.categories ?? defaultCategories

  const [localCategories, setLocalCategories] = React.useState<ConsentCategories>(state.categories)

  // Sync local state when modal opens or when state changes
  React.useEffect(() => {
    if (isSettingsOpen) {
      setLocalCategories(state.categories)
    }
  }, [isSettingsOpen, state.categories])

  const handleToggle = (key: ConsentCategory, checked: boolean) => {
    setLocalCategories((prev) => ({
      ...prev,
      [key]: checked,
    }))
  }

  const handleSave = async () => {
    await updateConsent(localCategories)
    closeSettings()
  }

  const handleAcceptAll = async () => {
    const allAccepted = getAllAcceptedCategories()
    // Update local state immediately for UI feedback
    setLocalCategories(allAccepted)
    await acceptAll()
    closeSettings()
  }

  const handleRejectAll = async () => {
    const defaultCats = getDefaultCategories()
    // Update local state immediately for UI feedback
    setLocalCategories(defaultCats)
    await rejectAll()
    closeSettings()
  }

  return (
    <Dialog open={isSettingsOpen} onOpenChange={(open) => !open && closeSettings()}>
      <DialogContent
        overlayClassName="z-100 bg-stone/60 backdrop-blur-sm supports-backdrop-filter:backdrop-blur-sm"
        className={cn(
          "z-100 max-h-[min(90vh,720px)] gap-0 overflow-hidden border border-warm-light bg-cream p-0 font-sans text-stone shadow-2xl ring-0 sm:max-w-lg",
          className,
        )}
      >
        <div className="space-y-4 px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-light">
                <Shield className="h-5 w-5 text-sage-dark" />
              </div>
              <div>
                <DialogTitle className="font-serif text-lg font-normal text-stone">
                  Informasjonskapsler
                </DialogTitle>
                <DialogDescription className="text-stone/70">
                  Velg hvilke typer informasjonskapsler du vil tillate.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator className="bg-warm-light" />

          <div className="space-y-3 max-h-[min(50vh,420px)] overflow-y-auto pr-1">
            {categories.map((category) => {
              const isEnabled = localCategories[category.key]
              const isRequired = category.required

              return (
                <div
                  key={category.key}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors",
                    isEnabled
                      ? "border-sage/25 bg-sage-light/70"
                      : "border-warm-light bg-cream",
                  )}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label
                        id={`cookie-${category.key}-label`}
                        htmlFor={`cookie-${category.key}`}
                        className="cursor-pointer text-sm font-medium text-stone"
                      >
                        {category.title}
                      </Label>
                      {isRequired && (
                        <span className="rounded-full bg-sage-light px-2 py-0.5 text-xs text-sage-dark">
                          Påkrevd
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-stone/70">{category.description}</p>
                  </div>
                  <ConsentSwitch
                    id={`cookie-${category.key}`}
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggle(category.key, checked)}
                    disabled={isRequired}
                    aria-labelledby={`cookie-${category.key}-label`}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-warm-light bg-warm-light/35 px-6 py-4 text-center">
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectAll}
              className="w-full rounded-full border-stone/20 bg-cream text-stone hover:bg-cream hover:text-stone sm:w-auto"
            >
              Kun nødvendige
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAcceptAll}
              className="w-full rounded-full border-stone/20 bg-cream text-stone hover:bg-cream hover:text-stone sm:w-auto"
            >
              Godta alle
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="w-full gap-2 rounded-full bg-stone text-cream hover:bg-stone/90 sm:w-auto"
            >
              <Check className="h-4 w-4" />
              Lagre valg
            </Button>
          </div>

          {config.privacyPolicyUrl && (
            <p className="mt-3 text-center text-xs text-stone/60">
              Les{" "}
              <a
                href={config.privacyPolicyUrl}
                className="text-sage-dark underline underline-offset-4 transition-colors hover:text-sage"
              >
                personvernerklæringen
              </a>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
