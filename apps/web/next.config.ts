import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@amigo/db", "@amigo/types", "@amigo/ui"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default withSerwist(nextConfig);
