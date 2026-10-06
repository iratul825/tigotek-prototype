import { emptyPreviewReview, previewActionSchema, type PreviewReview, type PreviewAction } from "../lib/preview-review";

type StoredReview = Omit<PreviewReview, "canManage"> & { manager: string | null };
class ReviewError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
const reply = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
const initial: StoredReview = { ...emptyPreviewReview, manager: null };
async function read(db: D1Database): Promise<StoredReview> {
  await db.prepare("INSERT OR IGNORE INTO preview_reviews (id, data, revision) VALUES (?, ?, 0)").bind("project", JSON.stringify(initial)).run();
  const row = await db.prepare("SELECT data, revision FROM preview_reviews WHERE id = ?").bind("project").first<{ data: string; revision: number }>();
  if (!row) throw new Error("Review workspace unavailable");
  return { ...JSON.parse(row.data), revision: row.revision };
}
function visible(state: StoredReview, user: string): PreviewReview {
  const { manager, ...data } = state;
  return { ...data, canManage: !manager || manager === user };
}
function author(request: Request) {
  let name = request.headers.get("oai-authenticated-user-full-name") || "";
  if (request.headers.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8") {
    try { name = decodeURIComponent(name); } catch { name = ""; }
  }
  return (name.trim() || request.headers.get("oai-authenticated-user-email")?.split("@")[0] || "Project member").slice(0, 80);
}
function apply(state: StoredReview, action: PreviewAction, user: string, name: string, origin: string) {
  const now = new Date().toISOString();
  if (action.type === "connect") {
    if (state.manager && state.manager !== user) throw new ReviewError("Only the person who connected this preview can update its link.", 403);
    if (new URL(action.url).origin === origin) throw new ReviewError("Use the link to your project preview, rather than this portal.");
    state.manager = user;
    state.url = new URL(action.url).href;
    state.update = action.update;
    state.updated = now;
    state.updatedBy = name;
  } else if (action.type === "comment") {
    if (!state.url) throw new ReviewError("Connect a preview before leaving feedback.");
    if (state.comments.some(comment => comment.id === action.id)) return;
    if (state.comments.length >= 500) throw new ReviewError("This review space has reached 500 comments. Please contact your agency.");
    state.comments.unshift({ ...action, author: name, created: now, status: "Open", replies: [] });
  } else {
    const comment = state.comments.find(item => item.id === (action.type === "reply" ? action.commentId : action.id));
    if (!comment) throw new ReviewError("This comment could not be found.", 404);
    if (action.type === "reply") {
      if (comment.replies.some(item => item.id === action.id)) return;
      if (comment.replies.length >= 100) throw new ReviewError("Please start a new comment to continue this discussion.");
      comment.replies.push({ id: action.id, text: action.text, author: name, created: now });
    } else {
      if (state.manager !== user) throw new ReviewError("Only the preview owner can resolve or reopen feedback.", 403);
      comment.status = action.status;
    }
  }
}
export async function handlePreviewReview(request: Request, db: D1Database, user: string): Promise<Response> {
  try {
    if (request.method === "GET") return reply(visible(await read(db), user));
    if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);
    if (Number(request.headers.get("content-length") || 0) > 12000) throw new ReviewError("This message is too large.", 413);
    const raw = await request.text();
    if (raw.length > 12000) throw new ReviewError("This message is too large.", 413);
    let payload: unknown;
    try { payload = JSON.parse(raw); } catch { throw new ReviewError("Please submit a valid review update."); }
    const parsed = previewActionSchema.safeParse(payload);
    if (!parsed.success) throw new ReviewError(parsed.error.issues[0]?.message || "Please check your message.");
    for (let attempt = 0; attempt < 4; attempt++) {
      const state = await read(db);
      apply(state, parsed.data, user, author(request), new URL(request.url).origin);
      const revision = state.revision;
      state.revision++;
      const result = await db.prepare("UPDATE preview_reviews SET data = ?, revision = ? WHERE id = ? AND revision = ?").bind(JSON.stringify(state), state.revision, "project", revision).run();
      if (result.meta.changes === 1) return reply(visible(state, user));
    }
    throw new ReviewError("Another update arrived while saving. Please try again; your message is still here.", 409);
  } catch (error) {
    if (error instanceof ReviewError) return reply({ error: error.message }, error.status);
    console.error("Preview review failed", error);
    return reply({ error: "The review space is temporarily unavailable. Please try again." }, 503);
  }
}
