"use client";

import { useState } from "react";
import { Play, X, ShieldCheck } from "@phosphor-icons/react";
import { VideoPlayer } from "@/components/player/VideoPlayer";

export interface MovieWatchSectionProps {
  title: string;
  tmdbId: number;
  posterPath?: string | null;
  videoUrl?: string | null;
  mimeType?: string | null;
  playbackAssetId?: string | null;
  sourceAttribution?: string | null;
  initialProgressSeconds?: number;
}

export function MovieWatchSection({
  title,
  tmdbId,
  posterPath = null,
  videoUrl = null,
  mimeType = null,
  playbackAssetId = null,
  sourceAttribution = null,
  initialProgressSeconds = 0,
}: MovieWatchSectionProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="space-y-4">
      {/* Tombol Mulai Nonton Utama */}
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-[#D9A52E] bg-[#D9A52E] px-6 py-2.5 text-sm font-bold text-[#0A0A0A] shadow-md transition hover:bg-[#c49226]"
        >
          <Play size={18} weight="fill" />
          <span>{initialProgressSeconds > 10 ? "Lanjutkan Nonton" : "Mulai Nonton"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="flex items-center gap-2 rounded-xl border border-[#292929] bg-[#171717] px-5 py-2.5 text-sm font-semibold text-[#A3A3A3] transition hover:border-[#D9A52E] hover:text-[#F5F5F5]"
        >
          <X size={18} />
          <span>Tutup Pemutar</span>
        </button>
      )}

      {/* Tampilan Pemutar Video Sinematik (Theater View) */}
      {isOpen && (
        <div className="space-y-3 rounded-2xl border border-[#D9A52E]/30 bg-[#121212] p-4 sm:p-6 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-[#292929]">
            <div className="flex items-center gap-2 text-sm font-bold text-[#F5F5F5]">
              <span className="h-3 w-1 rounded-full bg-[#D9A52E]" />
              <span>Teater Pemutar Sinematik — {title}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#737373]">
              <ShieldCheck size={16} className="text-[#D9A52E]" />
              <span>Verifikasi Lisensi LayarRika</span>
            </div>
          </div>

          <VideoPlayer
            title={title}
            mediaType="MOVIE"
            tmdbId={tmdbId}
            posterPath={posterPath}
            videoUrl={videoUrl}
            mimeType={mimeType}
            playbackAssetId={playbackAssetId}
            sourceAttribution={sourceAttribution}
            initialProgressSeconds={initialProgressSeconds}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
