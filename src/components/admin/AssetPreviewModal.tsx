"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Hls from "hls.js";
import {
  X,
  Warning,
  Copy,
  Check,
  FilmStrip,
} from "@phosphor-icons/react";

export interface PreviewAssetData {
  id: string;
  title: string;
  mediaType: "MOVIE" | "TV";
  videoUrl: string;
  mimeType: string;
  quality: string;
  isPremiumRequired: boolean;
  sourceAttribution?: string | null;
}

interface AssetPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: PreviewAssetData | null;
}

export function AssetPreviewModal({
  isOpen,
  onClose,
  asset,
}: AssetPreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Initialize playback on modal open
  useEffect(() => {
    if (!isOpen || !asset) return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    const isHls =
      asset.videoUrl.includes(".m3u8") ||
      asset.mimeType === "application/x-mpegURL";

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;

        hls.loadSource(asset.videoUrl);
        hls.attachMedia(videoEl);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoEl.play().catch(() => {
            // Autoplay might be blocked by browser without interaction
          });
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setPlayerError(`Gagal memutar HLS Stream: ${data.details}`);
            hls.destroy();
          }
        });
      } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        // Native Safari HLS
        videoEl.src = asset.videoUrl;
        videoEl.play().catch(() => {});
      } else {
        setPlayerError("Format HLS tidak didukung pada browser ini.");
      }
    } else {
      // Standard MP4 / WebM
      videoEl.src = asset.videoUrl;
      videoEl.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoEl) {
        videoEl.pause();
        videoEl.src = "";
      }
    };
  }, [isOpen, asset]);

  if (typeof document === "undefined" || !isOpen || !asset) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(asset.videoUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-neutral-800 bg-[#121212] shadow-2xl p-6 text-neutral-100 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D9A52E]/15 text-[#D9A52E] border border-[#D9A52E]/30">
              <FilmStrip size={20} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate max-w-md">
                  {asset.title}
                </h3>
                {asset.isPremiumRequired && (
                  <span className="px-2 py-0.5 rounded-full bg-[#D9A52E]/20 text-[#D9A52E] border border-[#D9A52E]/30 text-[10px] font-black uppercase">
                    VIP
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 text-[10px] font-bold">
                  {asset.quality}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Uji Pemutaran Stream Langsung — Player Administrator
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Screen Container */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black border border-neutral-800 shadow-inner flex items-center justify-center">
          {playerError ? (
            <div className="p-6 text-center space-y-2">
              <Warning size={32} className="mx-auto text-amber-500" />
              <p className="text-sm font-semibold text-white">{playerError}</p>
              <p className="text-xs text-neutral-400">
                Periksa apakah URL stream valid dan server mengizinkan CORS headers.
              </p>
            </div>
          ) : (
            <video
              ref={videoRef}
              controls
              playsInline
              className="h-full w-full object-contain"
            />
          )}
        </div>

        {/* Metadata & Stream Details */}
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-400">URL Stream Video:</span>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition text-[11px] font-medium"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Salin URL</span>
                </>
              )}
            </button>
          </div>
          <p className="font-mono text-[11px] text-[#D9A52E] break-all bg-black/40 p-2 rounded-lg border border-neutral-800">
            {asset.videoUrl}
          </p>

          <div className="flex flex-wrap items-center justify-between pt-1 text-[11px] text-neutral-400 border-t border-neutral-800/60">
            <span>
              MIME: <strong className="text-neutral-200">{asset.mimeType}</strong>
            </span>
            {asset.sourceAttribution && (
              <span>
                Atribusi: <strong className="text-neutral-200">{asset.sourceAttribution}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition"
          >
            Tutup Pemutar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
