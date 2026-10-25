/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

interface Props {
  left: string | null;
  right: string | null;
  leftLabel: string;
  rightLabel: string;
  width: number;
  height: number;
}

export function CompareSlider({ left, right, leftLabel, rightLabel, width, height }: Props) {
  const [position, setPosition] = useState(50);

  if (!left || !right) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900 text-sm text-neutral-500">
        This view is not available for the current result.
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto w-full max-w-3xl select-none overflow-hidden rounded-xl border border-neutral-800 bg-black"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <img src={right} alt={rightLabel} className="absolute inset-0 h-full w-full object-fill" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={left} alt={leftLabel} className="h-full w-full object-fill" draggable={false} />
      </div>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(0,0,0,0.8)]"
        style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xs text-black shadow">
          ⇆
        </div>
      </div>

      <span className="pointer-events-none absolute top-2 left-2 rounded bg-black/70 px-2 py-0.5 text-xs">{leftLabel}</span>
      <span className="pointer-events-none absolute top-2 right-2 rounded bg-black/70 px-2 py-0.5 text-xs">{rightLabel}</span>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Comparison position"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}