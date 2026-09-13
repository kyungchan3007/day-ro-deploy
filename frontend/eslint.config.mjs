// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": ["error", {
        selector: "ImportDeclaration[source.value='zod/mini'] > :matches(ImportSpecifier, ImportDefaultSpecifier)",
        message: "Use import * as z from 'zod/mini'. Importing the named z namespace object retains locales/toJSONSchema in the bundle; named/default imports are prohibited to preserve this convention.",
      }, {
        selector: "ImportDeclaration[source.value='zod/mini'][specifiers.length=0]",
        message: "Use import * as z from 'zod/mini'; side-effect imports do not follow the contract import convention.",
      }, {
        selector: ":matches(ExportNamedDeclaration, ExportAllDeclaration)[source.value='zod/mini']",
        message: "Import zod/mini as a namespace at its use site; re-exports can reintroduce the z namespace object and retain locales/toJSONSchema.",
      }],
      "no-restricted-imports": ["error", {
        patterns: [{
          regex: "^zod(?:$|/(?!mini$|v4/core$|v4/locales/en\\.js$))",
          message: "Use zod/mini for contracts, zod/v4/core for errors, or zod/v4/locales/en.js for the English locale.",
        }],
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "storybook-static/**",
    ".claude/skills/**",
    "next-env.d.ts",
  ]),
  ...storybook.configs["flat/recommended"]
]);

export default eslintConfig;
