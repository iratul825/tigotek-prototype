import { initialState, ProjectState, Asset } from "../lib/project-data";
import { actionSchema, ProjectAction } from "../lib/actions";
import { handlePreviewReview } from "./preview-review";
type Env = {
  DB: D1Database;
  BUCKET: R2Bucket;
  ASSETS: { fetch: (r: Request) => Promise<Response> };
};
const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
const when = () =>
  new Date().toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
async function readState(env: Env, owner: string) {
  await env.DB.prepare(
    "INSERT OR IGNORE INTO portal_state (owner, data, revision) VALUES (?, ?, 0)",
  )
    .bind(owner, JSON.stringify(initialState))
    .run();
  const row = await env.DB.prepare(
    "SELECT data, revision FROM portal_state WHERE owner = ?",
  )
    .bind(owner)
    .first<{ data: string; revision: number }>();
  if (!row) throw Error("Project not found");
  return { ...JSON.parse(row.data), revision: row.revision } as ProjectState;
}
async function mutate(
  env: Env,
  owner: string,
  fn: (s: ProjectState) => ProjectState,
) {
  for (let i = 0; i < 4; i++) {
    const state = await readState(env, owner);
    const next = fn(structuredClone(state));
    next.revision = state.revision + 1;
    const result = await env.DB.prepare(
      "UPDATE portal_state SET data = ?, revision = ? WHERE owner = ? AND revision = ?",
    )
      .bind(JSON.stringify(next), next.revision, owner, state.revision)
      .run();
    if (result.meta.changes === 1) return next;
  }
  throw Error("Your project changed while saving. Please try again.");
}
function activity(
  s: ProjectState,
  action: string,
  type: "approval" | "feedback" | "asset" | "code" = "feedback",
) {
  s.activity.unshift({
    id: crypto.randomUUID(),
    person: "You",
    initials: "FK",
    action,
    time: when(),
    type,
  });
  s.activity = s.activity.slice(0, 100);
}
function apply(s: ProjectState, a: ProjectAction): ProjectState {
  switch (a.type) {
    case "approval": {
      const item = s.approvals.find((x) => x.id === a.id);
      if (!item) throw Error("Approval not found");
      if (a.status === "Changes requested" && !a.note?.trim())
        throw Error("Please describe the changes you need.");
      item.status = a.status;
      item.note = a.note;
      s.decisions.unshift({id:crypto.randomUUID(),title:`${item.title} ${item.version}: ${a.status.toLowerCase()}`,type:'Decision',body:a.note || `Client ${a.status === 'Approved' ? 'approved' : 'reopened'} the deliverable prepared by ${item.owner}.`,date:new Date().toISOString().slice(0,10),status:a.status === 'Approved' ? 'Approved' : 'Recorded'});
      activity(
        s,
        `${a.status === "Approved" ? "approved" : a.status === "Changes requested" ? "requested changes to" : "reopened"} ${item.title} ${item.version}`,
        "approval",
      );
      break;
    }
    case "feedback-add": {
      if (!s.feedback.some((f) => f.id === a.id)) {
        s.feedback.unshift({
          id: a.id,
          target: a.target,
          x: a.x,
          y: a.y,
          text: a.text,
          status: "Pending",
          created: when(),
          replies: [],
        });
        activity(s, `left feedback on ${a.target.replaceAll("-", " ")}`);
      }
      break;
    }
    case "feedback-status": {
      const f = s.feedback.find((x) => x.id === a.id);
      if (!f) throw Error("Comment not found");
      f.status = a.status;
      activity(
        s,
        `${a.status === "Resolved" ? "resolved" : "reopened"} feedback on ${f.target.replaceAll("-", " ")}`,
      );
      break;
    }
    case "feedback-reply": {
      const f = s.feedback.find((x) => x.id === a.id);
      if (!f) throw Error("Comment not found");
      f.replies.push({ text: a.text, author: "You" });
      activity(s, `replied to feedback on ${f.target.replaceAll("-", " ")}`);
      break;
    }
    case "decision": {
      if (!s.decisions.some((d) => d.id === a.id)) {
        s.decisions.unshift({
          id: a.id,
          title: a.title,
          type: a.kind,
          body: a.body,
          date: new Date().toISOString().slice(0, 10),
          status: "Recorded",
        });
        activity(s, `recorded ${a.title}`);
      }
      break;
    }
    case "settings":
      s.settings = {
        name: a.name,
        motion: a.motion,
        notifications: a.notifications,
        stagingUrl: a.stagingUrl,
      };
      break;
  }
  return s;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    const owner = request.headers.get("oai-authenticated-user-id");
    if (!owner)
      return json({ error: "Please sign in to access this project." }, 401);
    if (
      request.method !== "GET" &&
      request.headers.get("origin") !== url.origin
    )
      return json(
        { error: "This request did not come from your workspace." },
        403,
      );
    try {
      if (url.pathname === "/api/preview-review")
        return handlePreviewReview(request, env.DB, owner);
      if (url.pathname === "/api/project" && request.method === "GET")
        return json(await readState(env, owner));
      if (url.pathname === "/api/project" && request.method === "POST") {
        if (Number(request.headers.get("content-length") || 0) > 20000)
          return json({ error: "This request is too large." }, 413);
        const raw = await request.text();
        if (raw.length > 20000)
          return json({ error: "This request is too large." }, 413);
        const parsed = actionSchema.safeParse(JSON.parse(raw));
        if (!parsed.success)
          return json(
            { error: parsed.error.issues[0]?.message || "Invalid request" },
            400,
          );
        return json(await mutate(env, owner, (s) => apply(s, parsed.data)));
      }
      if (url.pathname === "/api/assets" && request.method === "POST") {
        if (
          Number(request.headers.get("content-length") || 0) >
          11 * 1024 * 1024
        )
          return json({ error: "Files must be 10 MB or smaller." }, 413);
        const form = await request.formData();
        const file = form.get("file");
        const category = form.get("category");
        if (
          !(file instanceof File) ||
          file.size > 10 * 1024 * 1024 ||
          file.size === 0
        )
          return json({ error: "Choose a non-empty file up to 10 MB." }, 400);
        if (!["Brand", "Content", "Marketing"].includes(String(category)))
          return json({ error: "Choose an asset category." }, 400);
        const name = file.name
          .replace(/[^a-zA-Z0-9._() -]/g, "_")
          .slice(0, 120);
        const ext = name.split(".").pop()?.toLowerCase();
        if (
          !ext ||
          ![
            "png",
            "jpg",
            "jpeg",
            "webp",
            "gif",
            "svg",
            "pdf",
            "txt",
            "md",
            "csv",
            "docx",
            "zip",
            "woff",
            "woff2",
            "ttf",
            "otf",
            "mp4",
          ].includes(ext)
        )
          return json(
            { error: "Choose an image, document, font, archive or MP4." },
            400,
          );
        const id = crypto.randomUUID();
        const key = `${encodeURIComponent(owner)}/${id}`;
        await env.BUCKET.put(key, await file.arrayBuffer(), {
          httpMetadata: { contentType: "application/octet-stream" },
        });
        const asset: Asset = {
          id,
          name,
          key,
          category: category as Asset["category"],
          status: "Received",
          size:
            file.size >= 1048576
              ? `${(file.size / 1048576).toFixed(1)} MB`
              : `${Math.max(1, Math.round(file.size / 1024))} KB`,
          type: ext.toUpperCase(),
          uploaded: when(),
        };
        try {
          return json(
            await mutate(env, owner, (s) => {
              s.assets.unshift(asset);
              activity(s, `uploaded ${name} to the asset vault`, "asset");
              return s;
            }),
          );
        } catch (e) {
          await env.BUCKET.delete(key);
          throw e;
        }
      }
      if (url.pathname.startsWith("/api/assets/") && request.method === "GET") {
        const id = url.pathname.split("/").pop();
        const state = await readState(env, owner);
        const asset = state.assets.find((a) => a.id === id);
        if (!asset?.key) return json({ error: "File not found" }, 404);
        const object = await env.BUCKET.get(asset.key);
        if (!object) return json({ error: "File not found" }, 404);
        return new Response(object.body, {
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Disposition": `attachment; filename="${asset.name}"`,
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
          },
        });
      }
      return json({ error: "Not found" }, 404);
    } catch (e) {
      console.error("Portal request failed", e);
      return json(
        {
          error:
            e instanceof Error &&
            /not found|Please|Your project/.test(e.message)
              ? e.message
              : "We could not save your changes. Your input is still here; please try again.",
        },
        503,
      );
    }
  },
};
