import type { MetadataRoute } from "next";
import { getAppBaseUrl } from "@/lib/utils/url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/movie/", "/tv/", "/search"],
      disallow: ["/profile", "/api/", "/login", "/register"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
