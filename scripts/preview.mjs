import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { pathToFileURL } from "node:url";
const dir = path.resolve("dist/client");
await fs.mkdir(".data/files", { recursive: true });
const db = new DatabaseSync(".data/portal.sqlite");
db.exec("CREATE TABLE IF NOT EXISTS local_migrations (name TEXT PRIMARY KEY)");
for (const file of (await fs.readdir("drizzle"))
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  if (!db.prepare("SELECT name FROM local_migrations WHERE name=?").get(file)) {
    db.exec(await fs.readFile(path.join("drizzle", file), "utf8"));
    db.prepare("INSERT INTO local_migrations(name) VALUES(?)").run(file);
  }
}
const DB = {
  prepare(sql) {
    const bound = (args = []) => ({
      bind(...params) {
        return bound(params);
      },
      async first() {
        return db.prepare(sql).get(...args) || null;
      },
      async run() {
        const result = db.prepare(sql).run(...args);
        return { success: true, meta: { changes: Number(result.changes) } };
      },
    });
    return bound();
  },
};
const bucketPath = (key) =>
  path.join(".data/files", Buffer.from(key).toString("hex"));
const BUCKET = {
  async put(key, body) {
    await fs.writeFile(bucketPath(key), Buffer.from(body));
  },
  async get(key) {
    try {
      return { body: await fs.readFile(bucketPath(key)) };
    } catch {
      return null;
    }
  },
  async delete(key) {
    await fs.rm(bucketPath(key), { force: true });
  },
};
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".txt": "text/plain",
  ".md": "text/plain",
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://127.0.0.1:3184");
      if (url.pathname.startsWith("/api/")) {
        const chunks = [];
        let bytes = 0;
        for await (const c of req) {
          bytes += c.length;
          if (bytes > 11 * 1024 * 1024) {
            res.writeHead(413);
            return res.end("Upload too large");
          }
          chunks.push(c);
        }
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers))
          if (v && !k.startsWith("oai-"))
            headers.set(k, Array.isArray(v) ? v[0] : v);
        headers.set("oai-authenticated-user-id", "local-preview");
        const request = new Request(url, {
          method: req.method,
          headers,
          ...(req.method === "POST" ? { body: Buffer.concat(chunks) } : {}),
        });
        const stat = await fs.stat("dist/server/index.js");
        const { default: worker } = await import(
          pathToFileURL(path.resolve("dist/server/index.js")).href +
            "?v=" +
            stat.mtimeMs
        );
        const reply = await worker.fetch(request, { DB, BUCKET });
        res.writeHead(reply.status, Object.fromEntries(reply.headers));
        return res.end(Buffer.from(await reply.arrayBuffer()));
      }
      const file = path.resolve(
        dir,
        "." +
          decodeURIComponent(
            url.pathname === "/" ? "/index.html" : url.pathname,
          ),
      );
      if (!file.startsWith(dir + path.sep)) {
        res.writeHead(403);
        return res.end();
      }
      const data = await fs.readFile(file);
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(data);
    } catch (e) {
      console.error(e);
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(3184, "127.0.0.1", () => console.log("Local: http://127.0.0.1:3184"));
