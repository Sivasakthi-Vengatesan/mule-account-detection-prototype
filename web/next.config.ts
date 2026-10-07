import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const repoName = "mule-account-detection-prototype";

const nextConfig: NextConfig = {
  // If building on GitHub Actions for GitHub Pages, export as static HTML with repository basePath
  ...(isGithubActions
    ? {
        output: "export",
        basePath: `/${repoName}`,
        images: {
          unoptimized: true,
        },
      }
    : {
        async rewrites() {
          const backendUrl =
            process.env.BACKEND_URL ||
            process.env.NEXT_PUBLIC_API_URL ||
            "http://127.0.0.1:8000";

          return [
            {
              source: "/api/:path*",
              destination: `${backendUrl}/api/:path*`,
            },
            {
              source: "/health",
              destination: `${backendUrl}/health`,
            },
          ];
        },
      }),
};

export default nextConfig;
