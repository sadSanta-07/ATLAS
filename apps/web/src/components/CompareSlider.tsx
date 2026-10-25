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
      <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-[#e2e0ef] bg-[#f6f5ff] px-6 text-center text-xs text-[#777583]">
        This view is not available for the current result.
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto w-full select-none overflow-hidden rounded-2xl border border-[#e2e0ef] bg-[#20211b]"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      <img src={right} alt={rightLabel} className="absolute inset-0 h-full w-full object-contain" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={left} alt={leftLabel} className="h-full w-full object-contain" draggable={false} />
      </div>

      <div className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_12px_rgba(0,0,0,0.45)]"
        style={{ left: `${position}%` }}>
        <div className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#dfe1d5] bg-[#faf9ff] text-sm text-[#303127] shadow-lg">
          ⇆
        </div>
      </div>

      <span className="pointer-events-none absolute left-3 top-3 max-w-[45%] truncate rounded-full border border-white/20 bg-[#20211b]/80 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur">{leftLabel}</span>
      <span className="pointer-events-none absolute right-3 top-3 max-w-[45%] truncate rounded-full border border-white/20 bg-[#20211b]/80 px-3 py-1.5 text-[10px] font-medium text-white backdrop-blur">{rightLabel}</span>

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
