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
      className={`group relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed transition ${
        dragging ? "border-cyan-400 bg-cyan-400/10" : "border-neutral-700 bg-neutral-900 hover:border-neutral-500"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {previewUrl ? (
        <>
          <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-3 py-2 text-xs">
            <span className="truncate">{file?.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFile(null);
              }}
              className="ml-2 rounded bg-neutral-800 px-2 py-0.5 hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        </>
      ) : (
        <div className="px-4 text-center">
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-1 text-xs text-neutral-500">{hint}</p>
          <p className="mt-3 text-xs text-neutral-600">Click or drag &amp; drop</p>
        </div>
      )}
    </div>
  );
}