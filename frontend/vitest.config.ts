import { defineConfig } from "vitest/config";
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(dirname, "src"),
      // 단위 테스트(node)는 react-server 조건으로 해석되지 않아 서버 전용 가드가 throw 한다.
      // Next 빌드에서는 그대로 클라이언트 import 를 막고, 테스트에서만 빈 모듈로 바꾼다(issue #139 S9).
      "server-only": path.join(dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    projects: [{
      extends: true,
      test: {
        environment: "node",
        include: ["src/**/*.{test,spec}.{ts,tsx}"],
        exclude: ["src/e2e/**/*"]
      }
    }, {
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});
