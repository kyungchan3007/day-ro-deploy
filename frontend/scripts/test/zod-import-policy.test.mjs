import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const eslint = new ESLint({ cwd: fileURLToPath(new URL("../../", import.meta.url)) });
const forbidden = ["zod", "zod/v3", "zod/v3/index.js", "zod/v4", "zod/v4/classic", "zod/v4/classic/external.js", "zod/v4-mini", "zod/v4/mini", "zod/locales", "zod/v4/locales", "zod/v4/locales/ko.js"];
for (const source of forbidden) {
  test(`blocks ${source} imports and re-exports`, async () => {
    for (const code of [`import * as schema from '${source}'; void schema;`, `export * from '${source}';`]) {
      const [result] = await eslint.lintText(code, { filePath: "src/shared/api/import-policy-probe.ts" });
      assert.ok(result.messages.some((m) => m.ruleId === "no-restricted-imports" && m.severity === 2));
    }
  });
}
for (const source of ["zod/mini", "zod/v4/core", "zod/v4/locales/en.js"]) {
  test(`allows ${source}`, async () => {
    const [result] = await eslint.lintText(`import * as schema from '${source}'; void schema;`, { filePath: "src/shared/api/import-policy-probe.ts" });
    assert.equal(result.errorCount, 0, JSON.stringify(result.messages));
  });
}

for (const code of [
  "import { z } from 'zod/mini'; void z;",
  "import { config } from 'zod/mini'; void config;",
  "import { z as schema } from 'zod/mini'; void schema;",
  "import schema from 'zod/mini'; void schema;",
  "import schema, * as z from 'zod/mini'; void schema; void z;",
  "import type { ZodMiniType } from 'zod/mini'; export type Schema = ZodMiniType;",
  "import 'zod/mini';",
  "export { z } from 'zod/mini';",
  "export * from 'zod/mini';",
]) {
  test(`blocks non-namespace mini access: ${code}`, async () => {
    const [result] = await eslint.lintText(code, { filePath: 'src/shared/api/import-policy-probe.ts' });
    assert.ok(result.messages.some((m) => m.ruleId === 'no-restricted-syntax' && m.severity === 2), JSON.stringify(result.messages));
  });
}
test("allows the canonical mini namespace import", async () => {
  const [result] = await eslint.lintText("import * as z from 'zod/mini'; void z;", { filePath: 'src/shared/api/import-policy-probe.ts' });
  assert.equal(result.errorCount, 0, JSON.stringify(result.messages));
});
