import { Brain, Ear, HandHeart, type LucideIcon } from "lucide-react";

const serviceIcons: Record<string, LucideIcon> = {
  // Production CMS slug (falls back to HandHeart when unmapped).
  "sonterapi-behandling": HandHeart,
  oreakupunktur: Ear,
  tankefeltterapi: Brain,
};

export function getServiceIcon(slug: string): LucideIcon {
  return serviceIcons[slug] ?? HandHeart;
}
