"use client";

import { useEffect, useRef } from "react";

interface RadarBackgroundProps {
  size?: number; // px, default 640
  opacity?: number; // 0-1, default 0.14
  rotationSeconds?: number; // full rotation duration, default 14
  color?: string; // stroke color, default currentColor
  offsetX?: string; // horizontal nudge from center, e.g. '8%'
  offsetY?: string; // vertical nudge from center, e.g. '5%'
}

export default function RadarBackground({
  size = 640,
  opacity = 0.14,
  rotationSeconds = 14,
  color = "currentColor",
  offsetX = "0%",
  offsetY = "0%",
}: RadarBackgroundProps) {
  const sweepRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion || !sweepRef.current) return;

    let angle = 0;
    let frameId: number;
    let lastTime = performance.now();
    const degreesPerMs = 360 / (rotationSeconds * 1000);

    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;
      // delta-time keeps the speed stable across frame drops / tab throttling
      angle = (angle + delta * degreesPerMs) % 360;
      if (sweepRef.current) {
        sweepRef.current.style.transform = `rotate(${angle}deg)`;
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [rotationSeconds]);

  const c = size / 2;

  return (
    <div
      aria-hidden="true"
      className="lr-radar-in"
      style={{
        position: "absolute",
        top: `calc(50% + ${offsetY})`,
        left: `calc(50% + ${offsetX})`,
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
        opacity,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {[0.94, 0.69, 0.44, 0.19].map((ratio, i) => (
          <circle
            key={i}
            cx={c}
            cy={c}
            r={c * ratio}
            fill="none"
            stroke={color}
            strokeWidth={0.5}
          />
        ))}
        <g
          ref={sweepRef}
          style={{ transformOrigin: `${c}px ${c}px`, willChange: "transform" }}
        >
          <line x1={c} y1={c} x2={c} y2={c * 0.06} stroke={color} strokeWidth={1} />
        </g>
      </svg>
    </div>
  );
}
