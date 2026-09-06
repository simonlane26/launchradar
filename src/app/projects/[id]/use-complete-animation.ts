"use client";

import { useState } from "react";

/**
 * Checkmark fade-in → title strikethrough → card collapse → *then* fire the
 * real mutation, so the animation plays out before the server round-trip
 * (and eventual revalidation) removes the row — makes completing something
 * feel like it "landed" rather than just vanishing. Timings: 550ms for the
 * check/strikethrough to read, then 400ms to collapse before `onComplete`.
 */
export function useCompleteAnimation(onComplete: () => void) {
  const [completing, setCompleting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const trigger = () => {
    if (completing) return;
    setCompleting(true);
    setTimeout(() => {
      setCollapsed(true);
      setTimeout(onComplete, 400);
    }, 550);
  };

  return { completing, collapsed, trigger };
}
