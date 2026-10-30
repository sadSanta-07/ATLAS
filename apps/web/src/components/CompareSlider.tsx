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

export function CompareSlider({
  left,
  right,
  leftLabel,
  rightLabel,
  width,
  height,
}: Props) {
  const [position, setPosition] = useState(50);

  if (!left || !right) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] px-6 text-center text-xs text-[var(--ink-soft)]">
        <p className="max-w-xs">
          This comparison layer is not available for the current analysis run.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto w-full select-none overflow-hidden rounded-xl border border-[var(--line-strong)] bg-[var(--ink)] shadow-sm"
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {/* Right Image */}
      <img
        src={right}
        alt={rightLabel}
        className="absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />

      {/* Left Image (clipped) */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={left}
          alt={leftLabel}
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>

      {/* Divider Line */}
      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-[var(--paper)] shadow-[0_0_10px_rgba(0,0,0,0.6)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--paper)] text-xs font-semibold text-[var(--ink)] shadow-md">
          ⇆
        </div>
      </div>

      {/* Floating Badges */}
      <div className="pointer-events-none absolute left-3 top-3 max-w-[45%] truncate rounded-md border border-[var(--paper)]/25 bg-[var(--ink)]/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--paper)] backdrop-blur-md">
        {leftLabel}
      </div>
      <div className="pointer-events-none absolute right-3 top-3 max-w-[45%] truncate rounded-md border border-[var(--paper)]/25 bg-[var(--ink)]/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--paper)] backdrop-blur-md">
        {rightLabel}
      </div>

      {/* Draggable invisible range input */}
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Comparison slider position"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
