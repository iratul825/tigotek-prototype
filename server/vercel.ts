import { neon } from "@neondatabase/serverless";
import { get, put, del } from "@vercel/blob";
import {
  createAuthServer,
  extractNeonAuthCookies,
  handleAuthProxyRequest,
  serializeSetCookie,
} from "@neondatabase/auth/server";
import type { IncomingMessage, ServerResponse } from "node:http";
import worker from "./worker";

const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
const database = () => neon(process.env.DATABASE_URL!);
let initialized: Promise<unknown> | undefined;
export function initialize() {
  return (initialized ??= database()
    .transaction([
      database().query(
        "CREATE TABLE IF NOT EXISTS portal_state (owner text PRIMARY KEY, data text NOT NULL, revision integer NOT NULL DEFAULT 0)",
      ),
      database().query(
        "CREATE TABLE IF NOT EXISTS preview_reviews (id text PRIMARY KEY, data text NOT NULL, revision integer NOT NULL DEFAULT 0)",
      ),
      database().query(
        "CREATE TABLE IF NOT EXISTS portal_members (email text PRIMARY KEY, name text NOT NULL, created timestamptz NOT NULL DEFAULT now())",
      ),
    ])
    .catch((error) => {
      initialized = undefined;
      throw error;
    }));
}
export const ownerEmail = () =>
  process.env.PORTAL_OWNER_EMAIL?.trim().toLowerCase() || "";
async function hasAccess(email: string) {
  if (email === ownerEmail()) return true;
  await initialize();
  return (
    (
      await database().query(
        "SELECT email FROM portal_members WHERE email=$1",
        [email],
      )
    ).length > 0
  );
}
export const postgresAdapter = {
  prepare(source: string) {
    let i = 0;
    const ignore = source.startsWith("INSERT OR IGNORE");
    const sql =
      source
        .replace("INSERT OR IGNORE", "INSERT")
        .replace(/\?/g, () => `$${++i}`) +
      (ignore ? " ON CONFLICT DO NOTHING" : "");
    const bind = (args: unknown[] = []) => ({
      bind: (...values: unknown[]) => bind(values),
      async first<T>() {
        await initialize();
        const rows = await database().query(sql, args);
        return (rows[0] || null) as T | null;
      },
      async run() {
        await initialize();
        const result = await database().query(sql, args, { fullResults: true });
        return { meta: { changes: result.rowCount || 0 } };
      },
    });
    return bind();
  },
};
export const bucket = {
  async put(key: string, body: ArrayBuffer) {
    await put(key, body, {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/octet-stream",
    });
  },
  async get(key: string) {
    const result = await get(key, { access: "private", useCache: false });
    return result?.statusCode === 200 ? { body: result.stream } : null;
  },
  async delete(key: string) {
    await del(key);
  },
};

export async function handle(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (
    !process.env.NEON_AUTH_BASE_URL ||
    !process.env.NEON_AUTH_COOKIE_SECRET ||
    !ownerEmail()
  )
    return json({ error: "The workspace is still being configured." }, 503);
  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    request.headers.get("origin") !== url.origin
  )
    return json(
      { error: "This request did not come from your workspace." },
      403,
    );
  const authConfig = {
    baseUrl: process.env.NEON_AUTH_BASE_URL,
    cookieSecret: process.env.NEON_AUTH_COOKIE_SECRET,
    sessionDataTtl: 60,
  };
  try {
    if (url.pathname.startsWith("/api/auth/")) {
      const path = url.pathname.slice("/api/auth/".length);
      if (path === "sign-up/email") {
        let body;
        try {
          body = ((await request.clone().json()) || {}) as { email?: unknown };
        } catch {
          return json({ message: "Please check your details." }, 400);
        }
        if (
          typeof body.email !== "string" ||
          !(await hasAccess(body.email.trim().toLowerCase()))
        )
          return json(
            {
              message:
                "This workspace is invitation-only. Ask your agency to add your email.",
            },
            403,
          );
      }
      return handleAuthProxyRequest({ ...authConfig, request, path });
    }
    const cookies: string[] = [];
    const auth = createAuthServer({
      ...authConfig,
      context: () => ({
        getCookies: () => extractNeonAuthCookies(request.headers),
        setCookie: (name, value, options) => {
          cookies.push(serializeSetCookie({ name, value, ...options }));
        },
        getHeader: (name) => request.headers.get(name),
        getOrigin: () => url.origin,
        getFramework: () => "vercel",
      }),
    });
    const { data: session } = await auth.getSession();
    const user = session?.user;
    if (!user)
      return json({ error: "Please sign in to access your workspace." }, 401);
    const email = user.email.toLowerCase();
    if (!user.emailVerified)
      return json(
        {
          error: "Verify your email to access the workspace.",
          verificationRequired: true,
          email,
        },
        403,
      );
    if (!(await hasAccess(email)))
      return json(
        { error: "Your email has not been invited to this workspace." },
        403,
      );
    let response: Response;
    if (url.pathname === "/api/session")
      response = json({
        user: { id: user.id, name: user.name, email },
        canManage: email === ownerEmail(),
      });
    else if (url.pathname === "/api/members") {
      if (email !== ownerEmail())
        return json(
          { error: "Only the workspace owner can manage access." },
          403,
        );
      await initialize();
      if (request.method === "POST") {
        const body = ((await request.json()) || {}) as {
          email?: unknown;
          name?: unknown;
          action?: unknown;
        };
        const memberEmail =
          typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(memberEmail) ||
          memberEmail.length > 254
        )
          return json({ error: "Enter a valid email address." }, 400);
        if (body.action === "remove") {
          if (memberEmail === ownerEmail())
            return json({ error: "The owner cannot be removed." }, 400);
          await database().query("DELETE FROM portal_members WHERE email=$1", [
            memberEmail,
          ]);
        } else
          await database().query(
            "INSERT INTO portal_members (email,name) VALUES ($1,$2) ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name",
            [
              memberEmail,
              String(body.name || memberEmail.split("@")[0]).slice(0, 80),
            ],
          );
      }
      response = json({
        members: await database().query(
          "SELECT email,name,created FROM portal_members ORDER BY created",
        ),
      });
    } else {
      // Never trust identity headers supplied by an internet client.
      const headers = new Headers(request.headers);
      for (const key of [...headers.keys()])
        if (key.startsWith("oai-authenticated-")) headers.delete(key);
      headers.set("oai-authenticated-user-id", user.id);
      headers.set("oai-authenticated-user-email", email);
      headers.set(
        "oai-authenticated-user-full-name",
        encodeURIComponent(user.name || email.split("@")[0]),
      );
      headers.set(
        "oai-authenticated-user-full-name-encoding",
        "percent-encoded-utf-8",
      );
      if (
        url.pathname === "/api/preview-review" &&
        request.method === "POST" &&
        email !== ownerEmail()
      ) {
        const action = (await request.clone().json()) as { type?: string };
        if (action.type === "connect")
          return json(
            { error: "Only the workspace owner can update the preview link." },
            403,
          );
      }
      const verified = new Request(request, { headers });
      response = await worker.fetch(verified, {
        DB: postgresAdapter as unknown as D1Database,
        BUCKET: bucket as unknown as R2Bucket,
        ASSETS: {
          fetch: async () => new Response("Not found", { status: 404 }),
        },
      });
    }
    if (url.pathname === "/api/preview-review" && response.ok) {
      const review = (await response.json()) as Record<string, unknown>;
      response = json({ ...review, canManage: email === ownerEmail() });
    }
    for (const cookie of cookies) response.headers.append("Set-Cookie", cookie);
    return response;
  } catch (error) {
    console.error(
      "Vercel portal request failed",
      error instanceof Error ? error.message : "unknown error",
    );
    return json(
      { error: "The workspace is temporarily unavailable. Please try again." },
      503,
    );
  }
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  try {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 4 * 1024 * 1024) {
        res.writeHead(413, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Choose a file smaller than 4 MB on this deployment.",
          }),
        );
        return;
      }
      chunks.push(Buffer.from(chunk));
    }
    const host = String(
      req.headers.host || process.env.VERCEL_URL || "localhost",
    );
    const scheme = process.env.VERCEL
      ? "https"
      : String(req.headers["x-forwarded-proto"] || "http");
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers))
      if (value)
        headers.set(name, Array.isArray(value) ? value.join(",") : value);
    const method = req.method || "GET";
    const request = new Request(`${scheme}://${host}${req.url || "/"}`, {
      method,
      headers,
      ...(!["GET", "HEAD"].includes(method)
        ? { body: Buffer.concat(chunks) }
        : {}),
    });
    const result = await handle(request);
    res.statusCode = result.status;
    for (const [name, value] of result.headers)
      if (name !== "set-cookie") res.setHeader(name, value);
    const cookies = result.headers.getSetCookie();
    if (cookies.length) res.setHeader("Set-Cookie", cookies);
    res.end(Buffer.from(await result.arrayBuffer()));
  } catch {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unable to complete this request." }));
  }
}
