import type { NextConfig } from "next";

const repoName = "day-ro-deploy";
const isGithubPagesBuild = process.env.DEPLOY_TARGET === "github-pages";

const nextConfig: NextConfig = {
  // E2E(및 로컬)에서 dev 서버를 127.0.0.1 로 접속할 때 Next dev 리소스가
  // cross-origin 으로 차단되어 클라이언트 하이드레이션/네비게이션이 깨지는 것을 방지한다.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath: isGithubPagesBuild ? `/${repoName}` : "",
  assetPrefix: isGithubPagesBuild ? `/${repoName}/` : undefined,
};

export default nextConfig;
