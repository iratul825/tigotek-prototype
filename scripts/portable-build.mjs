import { build } from "esbuild";
import fs from "node:fs/promises";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
const root = process.cwd();
await fs.mkdir("dist/client", { recursive: true });
await fs.mkdir("dist/server", { recursive: true });
await build({
  entryPoints: ["app/client.tsx"],
  bundle: true,
  outfile: "dist/client/app.js",
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_AUTH_ENABLED": JSON.stringify(process.env.PORTAL_VERCEL_BUILD === '1' ? 'true' : 'false') },
  alias: { "@": root },
  logLevel: "info",
});
const css = await fs.readFile("app/globals.css", "utf8");
const result = await postcss([
  tailwind({ base: root, optimize: true }),
]).process(css, { from: "app/globals.css", to: "dist/client/app.css" });
await fs.writeFile("dist/client/app.css", result.css);
await fs.cp("public", "dist/client", { recursive: true });
await fs.writeFile(
  "dist/client/index.html",
  '<!DOCTYPE html><html lang="en" class="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#11171b"><meta name="description" content="Your team. Your progress. Watch your project take shape inside the Tigotek live office."><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/app.css"><title>Tigotek — Live Office</title></head><body><a class="skip-link" href="#main-content">Skip to content</a><div id="root"></div><script type="module" src="/app.js"></script></body></html>',
);
try {
  await fs.access("server/worker.ts");
  await build({
    entryPoints: ["server/worker.ts"],
    bundle: true,
    outfile: "dist/server/index.js",
    format: "esm",
    platform: "neutral",
    target: "es2022",
    minify: true,
    logLevel: "info",
  });
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const hosting = JSON.parse(await fs.readFile(".openai/hosting.json", "utf8"));
await fs.mkdir("dist/.openai", { recursive: true });
await fs.copyFile(".openai/hosting.json", "dist/.openai/hosting.json");
await fs.cp("drizzle", "dist/.openai/drizzle", { recursive: true });
await fs.writeFile(
  "dist/server/wrangler.json",
  JSON.stringify(
    {
      name: "tigotek-live-office",
      main: "index.js",
      compatibility_date: "2026-05-15",
      compatibility_flags: ["nodejs_compat"],
      assets: {
        directory: "../client",
        binding: "ASSETS",
        not_found_handling: "single-page-application",
        run_worker_first: ["/api/*"],
      },
      d1_databases: hosting.d1
        ? [
            {
              binding: hosting.d1,
              database_name: "tigotek-portal",
              database_id: "00000000-0000-4000-8000-000000000000",
              migrations_dir: "../drizzle",
            },
          ]
        : [],
      r2_buckets: hosting.r2
        ? [{ binding: hosting.r2, bucket_name: "tigotek-assets" }]
        : [],
    },
    null,
    2,
  ),
);
console.log("Portal build complete.");
