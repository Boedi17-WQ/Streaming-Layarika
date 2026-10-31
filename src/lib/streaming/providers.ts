/**
 * Arsitektur Streaming & Validasi Sumber Media LayarRika
 *
 * Menggabungkan kepatuhan keamanan dan fleksibilitas pemutaran:
 * 1. Trailer Resmi (TMDB): Cuplikan resmi studio via YouTube No-Cookie dengan sandboxing ketat (Default).
 * 2. Server 1 (MultiEmbed): Pemutar film & episode penuh multi-server (Streamwish, Filelions, dll).
 * 3. Server 2 (VidSrc): Pemutar alternatif multi-audio.
 * 4. Demo HLS (Creative Commons): Media uji terbuka karya Blender Foundation.
 * 5. Stream Berlisensi: Dokumentasi staging untuk infrastruktur HLS/DRM resmi berlisensi.
 */

export type ProviderVerificationStatus =
  | "VERIFIED_LEGAL"
  | "DEMO_OPEN_SOURCE"
  | "LICENSED_ENDPOINT"
  | "THIRD_PARTY_EMBED";

export type StreamingProviderId =
  | "trailer"
  | "multiembed"
  | "vidsrc"
  | "demo"
  | "licensed";

export interface StreamingProvider {
  id: StreamingProviderId;
  name: string;
  badge: string;
  verificationStatus: ProviderVerificationStatus;
  isDefault?: boolean;
  isPlayable: boolean;
  complianceNotice?: string;
  sandboxPolicy?: string;
  getMovieUrl: (tmdbId: number, options?: { youtubeKey?: string; licensedUrl?: string }) => string | null;
  getTvUrl: (
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    options?: { youtubeKey?: string; licensedUrl?: string }
  ) => string | null;
}

export interface StreamParams {
  providerId: StreamingProviderId;
  mediaType: "MOVIE" | "TV";
  tmdbId: number;
  seasonNumber?: number;
  episodeNumber?: number;
  youtubeKey?: string;
  licensedUrl?: string;
}

// Hostname terpercaya yang diizinkan untuk pemutaran video langsung
export const ALLOWED_STREAM_HOSTS = [
  "www.youtube-nocookie.com",
  "www.youtube.com",
  "commondatastorage.googleapis.com",
  "test-streams.mux.dev",
  "bitdash-a.akamaihd.net",
  "multiembed.mov",
  "streamingnow.mov",
  "vsembed.su",
  "vidlink.pro",
  "uploads.video-commander.com",
  "vjs.zencdn.net",
  "interactive-examples.mdn.mozilla.net",
];

// Regex untuk mendeteksi IP privat / loopback (Pencegahan SSRF)
const PRIVATE_IP_REGEX =
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|::1)$/i;

/**
 * Validasi ketat format URL media langsung untuk mencegah SSRF.
 */
export function validateMediaStreamUrl(rawUrl: string): { valid: boolean; error?: string; cleanUrl?: string } {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { valid: false, error: "URL tidak boleh kosong." };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, error: "Format URL tidak valid." };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Skema URL harus HTTPS. Skema lain ditolak demi keamanan." };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (PRIVATE_IP_REGEX.test(hostname)) {
    return { valid: false, error: "Akses ke alamat IP lokal atau loopback ditolak demi keamanan." };
  }

  const customHosts = (process.env.LICENSED_STREAM_HOSTS || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const isAllowed = ALLOWED_STREAM_HOSTS.includes(hostname) || customHosts.includes(hostname);

  if (!isAllowed) {
    return {
      valid: false,
      error: `Host '${hostname}' tidak berada dalam daftar host berlisensi terpercaya.`,
    };
  }

  return { valid: true, cleanUrl: parsed.toString() };
}

/**
 * Registry Provider Streaming Web Video LayarRika.
 */
export const STREAMING_PROVIDERS: Record<StreamingProviderId, StreamingProvider> = {
  trailer: {
    id: "trailer",
    name: "Trailer Resmi (TMDB)",
    badge: "Official HD",
    verificationStatus: "VERIFIED_LEGAL",
    isDefault: true,
    isPlayable: true,
    sandboxPolicy: "allow-scripts allow-same-origin allow-presentation",
    complianceNotice: "Materi cuplikan resmi studio melalui integrasi TMDB API & YouTube No-Cookie bersandbox aman.",
    getMovieUrl: (_tmdbId, options) => {
      if (!options?.youtubeKey) return null;
      return `https://www.youtube-nocookie.com/embed/${options.youtubeKey}?enablejsapi=1&autoplay=0&modestbranding=1&rel=0`;
    },
    getTvUrl: (_tmdbId, _season, _episode, options) => {
      if (!options?.youtubeKey) return null;
      return `https://www.youtube-nocookie.com/embed/${options.youtubeKey}?enablejsapi=1&autoplay=0&modestbranding=1&rel=0`;
    },
  },

  multiembed: {
    id: "multiembed",
    name: "Server 1 (MultiEmbed)",
    badge: "Film Penuh",
    verificationStatus: "THIRD_PARTY_EMBED",
    isPlayable: true,
    complianceNotice: "Server pemutar film & episode penuh multi-stream. Gunakan tombol server lain jika terjadi buffering.",
    getMovieUrl: (tmdbId: number) =>
      `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
    getTvUrl: (tmdbId: number, season: number, episode: number) =>
      `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
  },

  vidsrc: {
    id: "vidsrc",
    name: "Server 2 (VidLink)",
    badge: "Multi-Audio",
    verificationStatus: "THIRD_PARTY_EMBED",
    isPlayable: true,
    complianceNotice: "Server alternatif pemutaran video dengan opsi multi-bahasa, subtitle, dan responsif di mobile & desktop.",
    getMovieUrl: (tmdbId: number) =>
      `https://vidlink.pro/movie/${tmdbId}?primaryColor=D9A52E`,
    getTvUrl: (tmdbId: number, season: number, episode: number) =>
      `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=D9A52E`,
  },

  demo: {
    id: "demo",
    name: "Demo HLS (Creative Commons)",
    badge: "Open Source",
    verificationStatus: "DEMO_OPEN_SOURCE",
    isPlayable: true,
    complianceNotice: "Media film terbuka karya Blender Foundation (Big Buck Bunny), berlisensi Creative Commons Attribution 3.0.",
    getMovieUrl: () => "https://uploads.video-commander.com/sample/BigBuckBunny.mp4",
    getTvUrl: () => "https://uploads.video-commander.com/sample/BigBuckBunny.mp4",
  },

  licensed: {
    id: "licensed",
    name: "Status Stream Berlisensi",
    badge: "DRM / HLS",
    verificationStatus: "LICENSED_ENDPOINT",
    isPlayable: false,
    complianceNotice: "Panduan integrasi manifest HLS / DRM resmi bagi operator produksi.",
    getMovieUrl: (_tmdbId, options) => {
      if (!options?.licensedUrl) return null;
      const validation = validateMediaStreamUrl(options.licensedUrl);
      return validation.valid ? validation.cleanUrl || null : null;
    },
    getTvUrl: (_tmdbId, _season, _episode, options) => {
      if (!options?.licensedUrl) return null;
      const validation = validateMediaStreamUrl(options.licensedUrl);
      return validation.valid ? validation.cleanUrl || null : null;
    },
  },
};

export const PROVIDER_LIST: StreamingProvider[] = Object.values(STREAMING_PROVIDERS);

export const ACTIVE_PLAYABLE_PROVIDERS = PROVIDER_LIST;

/**
 * Menghasilkan URL stream embed yang valid berdasarkan parameter media.
 */
export function getStreamUrl({
  providerId,
  mediaType,
  tmdbId,
  seasonNumber = 1,
  episodeNumber = 1,
  youtubeKey,
  licensedUrl,
}: StreamParams): string | null {
  const provider = STREAMING_PROVIDERS[providerId] || STREAMING_PROVIDERS.trailer;

  if (mediaType === "MOVIE") {
    return provider.getMovieUrl(tmdbId, { youtubeKey, licensedUrl });
  }

  return provider.getTvUrl(tmdbId, seasonNumber, episodeNumber, { youtubeKey, licensedUrl });
}
