process.env.PORTAL_VERCEL_BUILD = "1";
await import("./portable-build.mjs");
import { build } from "esbuild";
import fs from "node:fs/promises";
const output = ".vercel/output";
await fs.mkdir(`${output}/functions/api.func`, { recursive: true });
await fs.cp("dist/client", `${output}/static`, { recursive: true });
await build({
  entryPoints: ["server/vercel.ts"],
  bundle: true,
  outfile: `${output}/functions/api.func/index.mjs`,
  format: "esm",
  platform: "node",
  target: "node24",
  minify: true,
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
});
await fs.writeFile(
  `${output}/functions/api.func/.vc-config.json`,
  JSON.stringify({
    runtime: "nodejs24.x",
    handler: "index.mjs",
    launcherType: "Nodejs",
    shouldAddHelpers: true,
  }),
);
await fs.writeFile(
  `${output}/config.json`,
  JSON.stringify({
    version: 3,
    routes: [
      { src: "/api/.*", dest: "/api" },
      { handle: "filesystem" },
      { src: "/.*", dest: "/index.html" },
    ],
  }),
);
console.log("Vercel output ready.");
