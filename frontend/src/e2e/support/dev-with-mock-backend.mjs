import { spawn } from "node:child_process";

/**
 * Playwright webServer 진입점.
 * Next dev 서버와 E2E 전용 mock backend 서버를 함께 띄우고 종료 신호를 전파한다.
 */
const children = [];
const e2ePort = process.env.E2E_PORT ?? "3100";
const nextMode = process.env.E2E_SERVER_MODE === "start" ? "start" : "dev";
const nextArgs =
  nextMode === "start"
    ? ["run", "start", "--", "--port", e2ePort]
    : ["run", "dev"];

function spawnChild(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      ...options.env,
    },
  });

  children.push(child);

  child.on("exit", (code, signal) => {
    if (signal || code !== 0) {
      for (const other of children) {
        if (other !== child && !other.killed) {
          other.kill("SIGTERM");
        }
      }

      process.exit(code ?? 1);
    }
  });

  return child;
}

spawnChild(process.execPath, ["src/e2e/support/mock-backend-server.mjs"], {
  env: {
    MOCK_BACKEND_PORT: process.env.MOCK_BACKEND_PORT ?? "18080",
  },
});

spawnChild("npm", nextArgs, {
  env: {
    PORT: e2ePort,
    BACKEND_API_BASE_URL:
      process.env.BACKEND_API_BASE_URL ?? "http://127.0.0.1:18080",
    // 카카오 로그인 시작 경로가 인가 URL 을 만들 수 있도록 더미 키를 둔다(카카오 도메인은 e2e 에서 차단).
    KAKAO_REST_API_KEY: process.env.KAKAO_REST_API_KEY ?? "e2e-dummy-kakao-key",
    // start 모드(운영 빌드)를 http 로 띄우므로 Secure 없는 인증 쿠키를 명시적으로 허용한다(issue #139 S6).
    AUTH_COOKIE_ALLOW_INSECURE: "1",
  },
});

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
