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
      className={`group relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8574e8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf9ff] ${
        dragging
          ? "border-[#7565d8] bg-[#eeebff] ring-2 ring-[#dcd5ff]"
          : previewUrl
            ? "border-[#e2e0ef] bg-[#f3f1ff]"
            : "border-dashed border-[#dedaf5] bg-white/80 hover:border-[#a99aff] hover:bg-[#fbfcf5]"
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
          <img src={previewUrl} alt={label} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-[#20211b]/85 px-2.5 py-2 text-[10px] text-white backdrop-blur">
            <span className="min-w-0 truncate">{file?.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
              className="shrink-0 rounded-full border border-white/25 px-2 py-1 text-[9px] font-medium transition hover:border-white hover:bg-white/15"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center px-2 text-center">
          <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#edf0ff] text-lg text-[#7565d8] transition group-hover:bg-[#e2ddff]">＋</span>
          <span className="text-xs font-semibold text-[#303127]">{label}</span>
          <span className="mt-1 text-[10px] text-[#777583]">{hint}</span>
          <span className="mt-3 text-[9px] text-[#9a97ae]">Browse or drop</span>
        </div>
      )}
    </div>
  );
}
