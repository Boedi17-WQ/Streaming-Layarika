import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://layarrika.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/movie/", "/tv/", "/search"],
      disallow: ["/profile", "/api/", "/login", "/register"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
