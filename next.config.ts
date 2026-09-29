import type { NextConfig } from "next";

// STATIC_EXPORT=1 (GitHub Actions) → fully static site in ./out for GitHub Pages.
// Default (sandbox/dev) → standalone server build as before.
const isPages = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = isPages
  ? {
      output: "export",
      basePath: "/browser",
      assetPrefix: "/browser",
      trailingSlash: true,
      images: { unoptimized: true },
      typescript: { ignoreBuildErrors: true },
      reactStrictMode: false,
    }
  : {
      output: "standalone",
      typescript: { ignoreBuildErrors: true },
      reactStrictMode: false,
    };

export default nextConfig;
