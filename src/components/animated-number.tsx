"use client";

import { useEffect, useRef } from "react";

export default function AnimatedNumber({ value }: { value: number }) {
  const element = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  useEffect(() => {
    const node = element.current;
    const from = previous.current;
    previous.current = value;
    if (
      !node ||
      from === value ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const start = performance.now();
    let frame: number;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / 420);
      node!.textContent = String(
        Math.round(from + (value - from) * (1 - (1 - progress) ** 3)),
      );
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <span aria-label={String(value)}>
      <span ref={element} aria-hidden="true">
        {value}
      </span>
    </span>
  );
}
