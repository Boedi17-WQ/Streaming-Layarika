import type { NextConfig } from "next";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.sandbox.midtrans.com https://app.midtrans.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://image.tmdb.org https://*.tmdb.org https://themoviedb.org https://*.themoviedb.org https://secure.gravatar.com https://*.gravatar.com https://avatars.githubusercontent.com https://i.ytimg.com https://raw.githubusercontent.com https://*.midtrans.com;
  font-src 'self' data:;
  frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://multiembed.mov https://*.multiembed.mov https://streamingnow.mov https://*.streamingnow.mov https://vsembed.su https://*.vsembed.su https://*.2embed.cc https://2embed.cc https://*.embed.su https://embed.su https://*.vidlink.pro https://vidlink.pro https://*.streamwish.to https://*.filelions.to https://*.vidsrc.me https://*.vidsrc.to https://*.vidsrc.net https://*.vidsrc.xyz https://*.vidsrc.pm https://*.vidsrc.cc https://app.sandbox.midtrans.com https://app.midtrans.com;
  media-src 'self' https: blob:;
  connect-src 'self' https://api.themoviedb.org https://image.tmdb.org https://*.tmdb.org https://themoviedb.org https://*.themoviedb.org https://api.sandbox.midtrans.com https://app.sandbox.midtrans.com https://api.midtrans.com https://app.midtrans.com https://uploads.video-commander.com https://vjs.zencdn.net https://test-streams.mux.dev;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.tmdb.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "themoviedb.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.themoviedb.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), fullscreen=*",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/movies",
        destination: "/catalog?type=movie",
      },
      {
        source: "/series",
        destination: "/catalog?type=tv",
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
