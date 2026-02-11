import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    target: "node18",
    banner: {
      js: "#!/usr/bin/env node",
    },
  },
  {
    entry: { api: "src/api.ts" },
    format: ["esm"],
    dts: true,
    clean: false,
    sourcemap: true,
    target: "node18",
  },
]);
