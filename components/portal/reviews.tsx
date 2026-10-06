"use client";
import { useState } from "react";
import {
  Check,
  CheckCheck,
  Eye,
  MessageSquare,
  RotateCcw,
  Send,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectStore } from "@/hooks/use-project";
import { Approval, Feedback, Section } from "@/lib/project-data";
import { Avatar, Status } from "./primitives";
export function ApprovalCenter({
  store,
  onNavigate,
}: {
  store: ProjectStore;
  onNavigate: (s: Section) => void;
}) {
  const [filter, setFilter] = useState("Pending");
  const [review, setReview] = useState<Approval | null>(null);
  const [preview, setPreview] = useState<Approval | null>(null);
  const [note, setNote] = useState("");
  const approvals = store.state.approvals.filter(
    (a) =>
      filter === "All" ||
      (filter === "Approved"
        ? a.status === "Approved"
        : a.status !== "Approved"),
  );
  return (
    <div className="section-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">KEEP THE GOOD WORK MOVING</span>
          <h2>Your perspective makes it better.</h2>
          <p>
            Review the details. Make a decision. Your team takes it from here.
          </p>
        </div>
        <span className="large-count">
          {store.state.approvals.filter((a) => a.status !== "Approved").length}
          <small>awaiting your input</small>
        </span>
      </div>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          {["Pending", "Approved", "All"].map((v) => (
            <TabsTrigger key={v} value={v}>
              {v}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="approval-grid">
        {approvals.map((a) => (
          <article className="approval-card" key={a.id}>
            <button
              className={`approval-art art-${a.id}`}
              onClick={() => setPreview(a)}
              aria-label={`Preview ${a.title}`}
            >
              <span className="art-brand">FABRIPASS®</span>
              {a.id === "design" ? (
                <div className="mini-site">
                  <span>EVERY THREAD, ACCOUNTED FOR.</span>
                  <b>
                    A product.
                    <br />A passport.
                    <br />A better future.
                  </b>
                  <i>Trace the story</i>
                </div>
              ) : a.id === "copy" ? (
                <div className="copy-art">
                  <span>WORDS THAT WORK HARDER</span>
                  <b>
                    Every product
                    <br />
                    has a story.
                    <br />
                    <em>Make yours clear.</em>
                  </b>
                </div>
              ) : a.id === "meta" ? (
                <div className="ad-art">
                  <span>MADE TO BE KNOWN.</span>
                  <b>
                    Good products.
                    <br />
                    Great provenance.
                  </b>
                  <small>Know it. Trust it. Keep it.</small>
                </div>
              ) : (
                <div className="type-art">
                  Aa<span>Clarity, in every character.</span>
                </div>
              )}
              <span className="art-preview">
                <Eye size={14} />
                Preview {a.version}
              </span>
            </button>
            <div className="approval-body">
              <div className="section-heading">
                <span className="eyebrow">{a.kind}</span>
                <Status value={a.status} />
              </div>
              <h3>
                {a.title} <span>{a.version}</span>
              </h3>
              <p>{a.description}</p>
              {a.note && <blockquote>{a.note}</blockquote>}
              <div className="approval-owner">
                <Avatar
                  initials={a.owner
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                  small
                />
                <span>{a.owner}</span>
              </div>
              <div className="approval-actions">
                {a.status === "Approved" ? (
                  <button
                    className="secondary-button"
                    disabled={store.busy || !store.ready}
                    onClick={() =>
                      store.send({
                        type: "approval",
                        id: a.id,
                        status: "Awaiting approval",
                      })
                    }
                  >
                    <RotateCcw size={14} />
                    Reopen review
                  </button>
                ) : (
                  <>
                    <button
                      className="primary-button"
                      disabled={store.busy || !store.ready}
                      onClick={() =>
                        store.send({
                          type: "approval",
                          id: a.id,
                          status: "Approved",
                        })
                      }
                    >
                      <Check size={15} />
                      Approve
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setReview(a);
                        setNote(a.note || "");
                      }}
                    >
                      Request changes
                    </button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!approvals.length && (
        <div className="empty-state">
          <CheckCheck size={34} />
          <h3>You’re all caught up.</h3>
          <p>Every deliverable in this view has been reviewed.</p>
        </div>
      )}
      <Sheet open={!!review} onOpenChange={(v) => !v && setReview(null)}>
        <SheetContent className="portal-sheet">
          <SheetTitle>Request changes</SheetTitle>
          <SheetDescription>
            {review?.title} {review?.version}
          </SheetDescription>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                review &&
                (await store.send({
                  type: "approval",
                  id: review.id,
                  status: "Changes requested",
                  note,
                }))
              )
                setReview(null);
            }}
          >
            <label className="field-label" htmlFor="change-note">
              What would you like us to refine?
            </label>
            <textarea
              id="change-note"
              required
              maxLength={3000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Be specific about the result you want…"
              rows={8}
            />
            <p className="form-hint">
              Your feedback will be attached to this deliverable.
            </p>
            <button
              className="primary-button"
              disabled={store.busy || !store.ready || !note.trim()}
            >
              Send feedback
            </button>
          </form>
        </SheetContent>
      </Sheet>
      <Sheet open={!!preview} onOpenChange={(v) => !v && setPreview(null)}>
        <SheetContent className="portal-sheet wide-sheet">
          <SheetTitle>
            {preview?.title} {preview?.version}
          </SheetTitle>
          <SheetDescription>
            Prepared by {preview?.owner} · Review version
          </SheetDescription>
          <div className="deliverable-preview">
            {preview?.id === "copy" ? (
              <>
                <span className="eyebrow">HOMEPAGE COPY / V2</span>
                <h2>Every product has a story.</h2>
                <p>
                  Make it a story worth knowing. FABRIPASS connects products
                  with the people, materials, and moments that made them.
                </p>
                <h3>Know what you own.</h3>
                <p>
                  Trace a product from its source to your hands, with a digital
                  passport you can trust.
                </p>
                <h3>Built for a circular future.</h3>
                <p>
                  Care instructions, material provenance, and responsible next
                  steps. All in one scan.
                </p>
                <h3>Transparency is a good look.</h3>
                <p>Give your customers the proof behind your promise.</p>
              </>
            ) : preview?.id === "meta" ? (
              <>
                <div className="campaign-poster">
                  <span>FABRIPASS</span>
                  <h2>
                    Good products.
                    <br />
                    Great provenance.
                  </h2>
                  <p>Know the story behind every stitch.</p>
                  <b>Discover your product’s passport.</b>
                </div>
                <p>
                  Format: 1080 × 1350 · Meta feed concept
                  <br />
                  Audience: conscious consumers and apparel brands
                  <br />
                  Call to action: Learn more
                </p>
              </>
            ) : preview?.id === "typography" ? (
              <>
                <div className="type-sample">
                  Aa Bb Cc
                  <br />
                  0123456789
                </div>
                <h3>Inter · Product typography</h3>
                <p>
                  Clear, confident, and readable at every size. Headings use
                  medium weight; body copy uses regular weight.
                </p>
              </>
            ) : (
              <>
                <iframe
                  title="Homepage design review"
                  src="/preview.html"
                  className="design-review-frame"
                />
                <button
                  className="primary-button"
                  onClick={() => {
                    setPreview(null);
                    onNavigate("Staging");
                  }}
                >
                  Open interactive staging
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
export function FeedbackComposer({
  pin,
  onClose,
  store,
}: {
  pin: { target: string; x: number; y: number } | null;
  onClose: () => void;
  store: ProjectStore;
}) {
  const [text, setText] = useState("");
  return (
    <Sheet
      open={!!pin}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          setText("");
        }
      }}
    >
      <SheetContent className="portal-sheet">
        <SheetTitle>Leave a little direction.</SheetTitle>
        <SheetDescription>
          Feedback on {pin?.target.replaceAll("-", " ")}
        </SheetDescription>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              pin &&
              (await store.send({
                type: "feedback-add",
                id: crypto.randomUUID(),
                ...pin,
                text,
              }))
            ) {
              setText("");
              onClose();
            }
          }}
        >
          <label className="field-label" htmlFor="new-comment">
            Your feedback
          </label>
          <textarea
            id="new-comment"
            rows={7}
            required
            maxLength={3000}
            placeholder="What could we improve here?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="form-hint">
            This comment stays attached to the selected element across device
            sizes.
          </p>
          <button
            className="primary-button"
            disabled={!text.trim() || store.busy || !store.ready}
          >
            <MessageSquare size={15} />
            Post comment
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
export function FeedbackPanel({
  store,
  onNavigate,
  focusId,
}: {
  store: ProjectStore;
  onNavigate: (s: Section) => void;
  focusId?: string;
}) {
  const [filter, setFilter] = useState("Pending");
  const [reply, setReply] = useState<Record<string, string>>({});
  const feedback = store.state.feedback.filter(
    (f) => filter === "All" || f.status === filter,
  );
  return (
    <section className="section-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">A CONVERSATION, IN CONTEXT</span>
          <h2>Good feedback moves things forward.</h2>
          <p>Every note has a place. Every decision has a record.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => onNavigate("Staging")}
        >
          <MessageSquare size={15} />
          Comment on preview
        </button>
      </div>
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          {["Pending", "Resolved", "All"].map((v) => (
            <TabsTrigger key={v} value={v}>
              {v}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="feedback-list">
        {feedback.map((f, index) => (
          <article
            key={f.id}
            id={f.id}
            className={`feedback-card ${f.id === focusId ? "highlighted" : ""}`}
          >
            <div className="feedback-pin-number">{index + 1}</div>
            <div className="feedback-content">
              <div className="section-heading">
                <button
                  className="text-button element-link"
                  onClick={() => onNavigate("Staging")}
                >
                  {f.target.replaceAll("-", " ")}
                </button>
                <Status value={f.status} />
              </div>
              <div className="comment-author">
                <Avatar initials="FK" small />
                <b>You</b>
                <time>{f.created}</time>
              </div>
              <p>{f.text}</p>
              {f.replies.map((r, i) => (
                <div className="reply" key={i}>
                  <b>{r.author}</b>
                  <p>{r.text}</p>
                </div>
              ))}
              <form
                className="reply-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await store.send({
                      type: "feedback-reply",
                      id: f.id,
                      text: reply[f.id] || "",
                    })
                  )
                    setReply({ ...reply, [f.id]: "" });
                }}
              >
                <label className="sr-only" htmlFor={`reply-${f.id}`}>
                  Reply to {f.target}
                </label>
                <input
                  id={`reply-${f.id}`}
                  value={reply[f.id] || ""}
                  onChange={(e) =>
                    setReply({ ...reply, [f.id]: e.target.value })
                  }
                  placeholder="Add a reply…"
                  maxLength={3000}
                />
                <button
                  className="icon-button"
                  aria-label={`Send reply to ${f.target}`}
                  disabled={store.busy || !store.ready || !reply[f.id]?.trim()}
                >
                  <Send size={16} />
                </button>
              </form>
              <button
                className="text-button resolve-button"
                disabled={store.busy || !store.ready}
                onClick={() =>
                  store.send({
                    type: "feedback-status",
                    id: f.id,
                    status: f.status === "Resolved" ? "Pending" : "Resolved",
                  })
                }
              >
                {f.status === "Resolved" ? (
                  <RotateCcw size={14} />
                ) : (
                  <Check size={14} />
                )}{" "}
                {f.status === "Resolved"
                  ? "Reopen feedback"
                  : "Mark as resolved"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {!feedback.length && (
        <div className="empty-state">
          <CheckCheck size={32} />
          <h3>Nothing waiting here.</h3>
          <p>Open staging to leave a comment on the page.</p>
        </div>
      )}
    </section>
  );
}
