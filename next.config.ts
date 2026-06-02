import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import createMDX from "@next/mdx";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

// Turbopack needs MDX-loader options to be JSON-serialisable, so plugins
// are referenced by their npm name (string) rather than by an imported
// function. GitHub-flavoured Markdown gives us tables, task lists, and
// strikethrough; rehype-slug populates heading `id` attributes for the
// TOC's anchor links. Callouts are handled inline via JSX components
// from `src/components/articles/widgets` rather than a marker plugin.
const withMDX = createMDX({
  options: {
    remarkPlugins: [["remark-gfm", {}]],
    rehypePlugins: [["rehype-slug", {}]],
  },
});

const nextConfig: NextConfig = {
  // Allow .mdx in the project's source tree. Articles ship as MDX so they
  // can mix prose with interactive widgets without inventing a marker
  // mini-language.
  pageExtensions: ["ts", "tsx", "mdx"],
  // Tree-shake per-icon and per-motion-component imports. Lucide ships
  // ~1000 icons and motion ships every easing/transition primitive — the
  // optimisation only emits the symbols actually used at the call sites.
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default withBundleAnalyzer(withMDX(nextConfig));
