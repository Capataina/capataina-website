import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Tree-shake per-icon and per-motion-component imports. Lucide ships
  // ~1000 icons and motion ships every easing/transition primitive — the
  // optimisation only emits the symbols actually used at the call sites.
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default withBundleAnalyzer(nextConfig);
