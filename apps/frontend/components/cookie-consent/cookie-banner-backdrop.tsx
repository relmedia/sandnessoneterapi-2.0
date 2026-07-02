"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useCookieConsent } from "./cookie-provider";

export interface CookieBannerBackdropProps {
  className?: string;
  closeOnClick?: boolean;
  blur?: string;
  opacity?: number;
}

export function CookieBannerBackdrop({
  className,
  closeOnClick = false,
  blur = "4px",
  opacity = 0.5,
}: CookieBannerBackdropProps) {
  const { isBannerVisible, rejectAll } = useCookieConsent();

  const handleClick = () => {
    if (closeOnClick) {
      void rejectAll();
    }
  };

  return (
    <AnimatePresence>
      {isBannerVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn("fixed inset-0 z-40 bg-black", closeOnClick && "cursor-pointer", className)}
          style={{
            opacity,
            backdropFilter: `blur(${blur})`,
            WebkitBackdropFilter: `blur(${blur})`,
          }}
          onClick={handleClick}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}
