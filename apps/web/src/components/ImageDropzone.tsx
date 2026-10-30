/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";

interface Props {
  label: string;
  hint: string;
  file: File | null;
  previewUrl: string | null;
  onFile: (file: File | null) => void;
}

export function ImageDropzone({ label, hint, file, previewUrl, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accept = (f: File | undefined) => {
    if (f && f.type.startsWith("image/")) onFile(f);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Upload ${label}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        accept(e.dataTransfer.files[0]);
      }}
      className={`group relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-xl border transition-all duration-200 focus:outline-none ${
        dragging
          ? "border-[var(--accent)] bg-[var(--surface-hover)] ring-2 ring-[var(--accent)]/30"
          : previewUrl
            ? "border-[var(--line-strong)] bg-[var(--paper-deep)]"
            : "border-dashed border-[var(--line-strong)] bg-[var(--surface)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.currentTarget.value = "";
        }}
      />
      {previewUrl ? (
        <>
          <img
            src={previewUrl}
            alt={label}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 border-t border-[var(--line-strong)] bg-[var(--ink)]/90 px-3 py-2 text-[10px] text-[var(--paper)] backdrop-blur">
            <span className="min-w-0 truncate font-mono text-[10px] tracking-tight">
              {file?.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
              className="shrink-0 rounded-full border border-[var(--paper)]/30 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--paper)] transition hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center px-3 text-center">
          <span className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] font-mono text-sm text-[var(--accent)] transition-transform duration-200 group-hover:scale-110 group-hover:border-[var(--accent)]">
            +
          </span>
          <span className="text-xs font-semibold tracking-tight text-[var(--ink)]">
            {label}
          </span>
          <span className="mt-0.5 text-[10px] text-[var(--ink-soft)]">
            {hint}
          </span>
          <span className="mt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--accent)] opacity-80 group-hover:opacity-100">
            Click or drop file
          </span>
        </div>
      )}
    </div>
  );
}
