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
