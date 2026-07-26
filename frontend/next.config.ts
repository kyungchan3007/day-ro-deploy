import type { NextConfig } from "next";

const repoName = "day-ro-deploy";
const isGithubPagesBuild = process.env.DEPLOY_TARGET === "github-pages";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: isGithubPagesBuild ? `/${repoName}` : "",
  assetPrefix: isGithubPagesBuild ? `/${repoName}/` : undefined,
};

export default nextConfig;
