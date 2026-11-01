"use client";

import { useState } from "react";
import { ShareNetwork, Check } from "@phosphor-icons/react";

interface MovieShareButtonProps {
  title: string;
  className?: string;
}

export function MovieShareButton({ title, className = "" }: MovieShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${title} — LayarRika`,
          text: `Tonton ${title} secara streaming di LayarRika`,
          url,
        });
        return;
      } catch {
        // Fallback jika dibatalkan pengguna
      }
    }

    // Fallback: Salin ke clipboard
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Abaikan jika tidak diizinkan clipboard
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-[#2a2a2e] bg-[#141416] px-3 py-1.5 text-xs font-medium text-[#c4c4c8] transition hover:border-[#D9A52E] hover:text-[#F5F5F5] ${className}`}
      title="Bagikan film ini"
    >
      {copied ? (
        <>
          <Check size={14} className="text-emerald-400" />
          <span className="text-emerald-400">Tersalin!</span>
        </>
      ) : (
        <>
          <ShareNetwork size={14} />
          <span>Bagikan</span>
        </>
      )}
    </button>
  );
}

