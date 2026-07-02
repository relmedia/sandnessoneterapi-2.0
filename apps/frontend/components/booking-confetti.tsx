"use client";

import { useEffect } from "react";

import confetti from "canvas-confetti";

const CONFETTI_COLORS = ["#ff5e7e", "#ffc107", "#26ccff", "#88ff5a", "#a25afd", "#fcff42", "#ff36ff"];

export function BookingConfetti() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    confetti({
      particleCount: 120,
      spread: 100,
      startVelocity: 42,
      origin: { x: 0.5, y: 0.55 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    });
  }, []);

  return null;
}
