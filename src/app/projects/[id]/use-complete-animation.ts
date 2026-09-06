"use client";

import { useState, type RefObject } from "react";

/**
 * Checkmark fade-in → title strikethrough → card collapse → *then* fire the
 * real mutation, so the animation plays out before the server round-trip
 * (and eventual revalidation) removes the row — makes completing something
 * feel like it "landed" rather than just vanishing. Timings: 550ms for the
 * check/strikethrough to read, then 400ms to collapse before `onComplete`.
 *
 * Pass the card element ref and the returned `height` is the card's pixel
 * height captured at trigger time — use it as the `max-height` the collapse
 * transition starts from, so the card can otherwise render unbounded (long
 * "Create with AI" drafts) without a fixed clip.
 */
export function useCompleteAnimation<T extends HTMLElement>(
  onComplete: () => void,
  ref?: RefObject<T | null>,
) {
  const [completing, setCompleting] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [height, setHeight] = useState<number | null>(null);

  const trigger = () => {
    if (completing) return;
    setHeight(ref?.current?.scrollHeight ?? null);
    setCompleting(true);
    setTimeout(() => {
      setCollapsed(true);
      setTimeout(onComplete, 400);
    }, 550);
  };

  return { completing, collapsed, height, trigger };
}
