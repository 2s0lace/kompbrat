import type { MetadataRoute } from "next";

import { allBuilds } from "@/lib/builds/data";
import { SITE_URL } from "@/lib/utils/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/builder", "/checker", "/builds"];

  return [
    ...routes.map((route) => ({
      url: `${SITE_URL}${route}`,
      lastModified: new Date(),
    })),
    ...allBuilds.map((build) => ({
      url: `${SITE_URL}/builds/${build.slug}`,
      lastModified: new Date(),
    })),
  ];
}
