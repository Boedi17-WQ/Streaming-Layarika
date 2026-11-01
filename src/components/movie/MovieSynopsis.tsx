"use client";

import { useState } from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";

interface MovieSynopsisProps {
  overview: string | null;
}

export function MovieSynopsis({ overview }: MovieSynopsisProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!overview) {
    return (
      <p className="text-xs sm:text-sm text-[#737373] italic">
        Sinopsis belum tersedia untuk judul ini.
      </p>
    );
  }

  const isLong = overview.length > 180;

  return (
    <div className="space-y-1 text-xs sm:text-sm text-[#a3a3a8] leading-relaxed">
      <p className={isExpanded ? "" : "line-clamp-2"}>
        <span className="font-medium text-[#d4d4d8]">Deskripsi: </span>
        {overview}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-[#D9A52E] hover:underline cursor-pointer pt-0.5"
        >
          <span>{isExpanded ? "Lebih Sedikit" : "Selengkapnya"}</span>
          {isExpanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
        </button>
      )}
    </div>
  );
}

