"use client";
import { useId, useState } from "react";
import { Check, Copy, ExternalLink, Link2, MessageSquare, Pencil, RotateCcw, Send } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type PreviewReviewStore } from "@/hooks/use-preview-review";
import { previewUrlSchema, type PreviewComment } from "@/lib/preview-review";

const dateLabel = (value: string) => new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
function PreviewLinkForm({ store, onDone, onCancel }: { store: PreviewReviewStore; onDone: () => void; onCancel?: () => void }) {
  const id = useId();
  const [url, setUrl] = useState(store.state.url);
  const [update, setUpdate] = useState(store.state.update);
  const [error, setError] = useState("");
  return <form className="preview-connect-form" noValidate onSubmit={async event => {
    event.preventDefault();
    const parsed = previewUrlSchema.safeParse(url);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    if (new URL(parsed.data).origin === location.origin) { setError("Paste your project’s preview link, rather than this portal’s link."); return; }
    setError("");
    if (await store.send({ type: "connect", url: parsed.data, update })) onDone();
  }}>
    <label className="field-label" htmlFor={`${id}-url`}>Vercel preview link</label>
    <div className="preview-url-row">
      <div className="preview-url-input"><Link2 size={17} /><input id={`${id}-url`} type="url" inputMode="url" autoComplete="url" required maxLength={2048} value={url} onChange={event => setUrl(event.target.value)} placeholder="https://your-project.vercel.app" aria-invalid={!!error} aria-describedby={`${id}-hint`} /></div>
      <button className="primary-button" disabled={!store.ready || store.busy}>{store.busy ? "Saving…" : "Save preview"}</button>
    </div>
    <p className={error ? "review-form-error" : "form-hint"} id={`${id}-hint`} role={error ? "alert" : undefined}>{error || "Paste a Vercel deployment link or any HTTPS preview address."}</p>
    <label className="field-label" htmlFor={`${id}-update`}>What’s new? <span className="muted">Optional</span></label>
    <textarea id={`${id}-update`} value={update} onChange={event => setUpdate(event.target.value)} rows={2} maxLength={600} placeholder="e.g. The homepage is ready. Please review the navigation and mobile layout." />
    {onCancel && <button type="button" className="text-button" onClick={onCancel}>Cancel changes</button>}
  </form>;
}

export function PreviewLinkCard({ store, onReview }: { store: PreviewReviewStore; onReview?: () => void }) {
  const [editing, setEditing] = useState(false);
  const { state } = store;
  const connected = !!state.url;
  return <section className="preview-connect-card" aria-label="Project preview link">
    <div className="preview-connect-heading">
      <div className="preview-link-emblem"><Link2 size={21} /></div>
      <div><span className="eyebrow">BUILD IN THE OPEN</span><h3>{connected ? "Your project, ready to review." : "Give your client a window into the work."}</h3></div>
      {connected && state.canManage && !editing && <button className="icon-button" aria-label="Edit preview link" onClick={() => setEditing(true)}><Pencil size={16} /></button>}
    </div>
    {store.error && <div className="review-load-error" role="alert"><span>{store.error}</span><button className="text-button" onClick={store.refresh}>Retry</button></div>}
    {!store.ready ? <p className="form-hint">Connecting to the review space…</p> : !connected || editing ?
      <PreviewLinkForm key={`${state.url}-${state.updated}`} store={store} onDone={() => { setEditing(false); onReview?.(); }} onCancel={connected ? () => setEditing(false) : undefined} /> : <>
        <a className="saved-preview-link" href={state.url} target="_blank" rel="noopener noreferrer"><span>{state.url}</span><ExternalLink size={16} /></a>
        {state.update && <p className="preview-build-note">{state.update}</p>}
        <div className="preview-connection-meta"><span>Updated {dateLabel(state.updated)} · {state.updatedBy}</span><span>{state.comments.filter(item => item.status === "Open").length} open comments</span></div>
        <div className="preview-connect-actions">
          {onReview && <button className="primary-button" onClick={onReview}><MessageSquare size={15} />Preview & feedback</button>}
          <button className="secondary-button" onClick={async () => {
            try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}#Staging`); toast.success("Review link copied. Clients also need access to this portal."); }
            catch { toast.error("Could not copy. Open Staging and copy the address from your browser."); }
          }}><Copy size={15} />Copy client review link</button>
        </div>
        <p className="review-access-hint">Invite your client through the portal’s site sharing before sending this link. A preview link alone does not grant portal access.</p>
      </>}
  </section>;
}

function ReviewThread({ comment, store }: { comment: PreviewComment; store: PreviewReviewStore }) {
  const [reply, setReply] = useState("");
  return <article className="client-review-thread" data-review-id={comment.id}>
    <div className="review-thread-heading"><span className={`review-kind kind-${comment.kind.toLowerCase()}`}>{comment.kind}</span><span className={comment.status === "Resolved" ? "review-resolved" : "muted"}>{comment.status}</span></div>
    <p className="review-page-context">{comment.page} · {comment.device}</p>
    <p className="review-message">{comment.text}</p>
    <div className="review-author"><b>{comment.author}</b><time dateTime={comment.created}>{dateLabel(comment.created)}</time></div>
    <a className="review-build-reference" href={comment.url} target="_blank" rel="noopener noreferrer">Preview at time of comment <ExternalLink size={12} /></a>
    {comment.replies.map(item => <div className="review-thread-reply" key={item.id}><div className="review-author"><b>{item.author}</b><time dateTime={item.created}>{dateLabel(item.created)}</time></div><p>{item.text}</p></div>)}
    <form className="review-reply-form" onSubmit={async event => {
      event.preventDefault();
      if (await store.send({ type: "reply", id: crypto.randomUUID(), commentId: comment.id, text: reply })) setReply("");
    }}>
      <label className="sr-only" htmlFor={`review-reply-${comment.id}`}>Reply to {comment.page}</label>
      <input id={`review-reply-${comment.id}`} value={reply} onChange={event => setReply(event.target.value)} placeholder="Add a reply…" maxLength={3000} required />
      <button className="icon-button" aria-label={`Send reply to ${comment.page}`} disabled={!reply.trim() || store.busy || !store.ready}><Send size={16} /></button>
    </form>
    {store.state.canManage && <button className="text-button review-resolve-button" disabled={store.busy || !store.ready} onClick={() => store.send({ type: "status", id: comment.id, status: comment.status === "Open" ? "Resolved" : "Open" })}>{comment.status === "Open" ? <Check size={14} /> : <RotateCcw size={14} />}{comment.status === "Open" ? "Mark resolved" : "Reopen comment"}</button>}
  </article>;
}

export function PreviewDiscussion({ store, device = "desktop" }: { store: PreviewReviewStore; device?: PreviewComment["device"] }) {
  const [kind, setKind] = useState<PreviewComment["kind"]>("Suggestion");
  const [page, setPage] = useState("");
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("Open");
  const [draftUrl, setDraftUrl] = useState("");
  const comments = store.state.comments.filter(item => filter === "All" || item.status === filter);
  const id = useId();
  return <section className="client-review-panel" aria-label="Client suggestions and feedback">
    <div className="review-panel-heading"><span className="eyebrow">THE CONVERSATION</span><h3>Suggestions & feedback <span>{store.state.comments.length}</span></h3><p>Shared with everyone invited to this portal.</p></div>
    {store.error && <div className="review-load-error" role="alert">{store.error}<button className="text-button" onClick={store.refresh}>Retry</button></div>}
    {!store.state.url ? <p className="review-empty">Save a preview link to start the conversation.</p> : <form className="client-review-composer" onSubmit={async event => {
      event.preventDefault();
      if (await store.send({ type: "comment", id: crypto.randomUUID(), url: draftUrl || store.state.url, kind, page: page.trim() || "General preview", device, text })) { setText(""); setPage(""); setDraftUrl(""); setFilter("Open"); }
    }}>
      <Tabs value={kind} onValueChange={value => setKind(value as PreviewComment["kind"])}><TabsList aria-label="Feedback type">{["Suggestion", "Issue", "Feedback"].map(value => <TabsTrigger key={value} value={value}>{value}</TabsTrigger>)}</TabsList></Tabs>
      <label className="field-label" htmlFor={`${id}-page`}>Page or section <span className="muted">Optional</span></label>
      <input id={`${id}-page`} value={page} onChange={event => { setPage(event.target.value); if (!draftUrl) setDraftUrl(store.state.url); }} placeholder="e.g. /pricing · mobile navigation" maxLength={160} />
      <label className="field-label" htmlFor={`${id}-message`}>Your feedback</label>
      <textarea id={`${id}-message`} className="client-feedback-input" value={text} onChange={event => { setText(event.target.value); if (!draftUrl) setDraftUrl(store.state.url); }} placeholder="What’s working? What would you like us to improve?" rows={4} maxLength={3000} required />
      {draftUrl && draftUrl !== store.state.url && <p className="form-hint">The preview link changed. This comment will stay attached to the link you started reviewing.</p>}
      <button className="primary-button" disabled={!text.trim() || store.busy || !store.ready}><Send size={15} />{store.busy ? "Saving…" : "Post feedback"}</button>
    </form>}
    <div className="review-filter"><Tabs value={filter} onValueChange={setFilter}><TabsList aria-label="Filter client feedback">{["Open", "Resolved", "All"].map(value => <TabsTrigger value={value} key={value}>{value}</TabsTrigger>)}</TabsList></Tabs><button className="text-button" onClick={store.refresh} aria-label="Refresh client feedback">Refresh</button></div>
    <div className="client-review-list">{comments.map(comment => <ReviewThread key={comment.id} comment={comment} store={store} />)}</div>
    {!comments.length && store.state.url && <div className="review-empty"><MessageSquare size={24} /><p>{filter === "Resolved" ? "Resolved comments will appear here." : filter === "All" ? "No feedback yet. Start the conversation above." : "No open comments. Leave a suggestion above."}</p></div>}
  </section>;
}
