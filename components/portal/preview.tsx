"use client";
import { useState, useRef, useEffect } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Globe,
  Lock,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectStore } from "@/hooks/use-project";
import { Section } from "@/lib/project-data";
import { FeedbackComposer } from "./reviews";
import { PreviewLinkCard, PreviewDiscussion } from "./preview-review";
import { PreviewReviewStore } from "@/hooks/use-preview-review";
import { PreviewComment } from "@/lib/preview-review";
export function LivePreview({
  store,
  reviewStore,
  onNavigate,
  onFocusFeedback,
}: {
  store: ProjectStore;
  reviewStore: PreviewReviewStore;
  onNavigate: (s: Section) => void;
  onFocusFeedback: (id: string) => void;
}) {
  const [device, setDevice] = useState<PreviewComment["device"]>("desktop");
  const [comment, setComment] = useState(false);
  const [version, setVersion] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [pin, setPin] = useState<{
    target: string;
    x: number;
    y: number;
  } | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const source = reviewStore.state.url || store.state.settings.stagingUrl;
  const local = source === "/preview.html";
  useEffect(() => { setLoaded(false); setComment(false); setPin(null); }, [source]);
  useEffect(() => {
    const listener = (e: MessageEvent) => {
      if (
        e.source !== frame.current?.contentWindow ||
        e.origin !== new URL(source, location.origin).origin ||
        e.data?.source !== "fabri-preview"
      )
        return;
      if (
        e.data.type === "pin" &&
        typeof e.data.target === "string" &&
        Number.isFinite(e.data.x) &&
        Number.isFinite(e.data.y)
      )
        setPin({
          target: e.data.target.slice(0, 100),
          x: Math.min(100, Math.max(0, e.data.x)),
          y: Math.min(100, Math.max(0, e.data.y)),
        });
      if (e.data.type === "open-pin" && typeof e.data.id === "string") {
        onFocusFeedback(e.data.id);
        onNavigate("Feedback");
      }
    };
    addEventListener("message", listener);
    return () => removeEventListener("message", listener);
  }, [source, onNavigate, onFocusFeedback]);
  useEffect(() => {
    if (local && loaded)
      frame.current?.contentWindow?.postMessage(
        {
          source: "tigotek-portal",
          type: "review-state",
          comment,
          pins: store.state.feedback,
        },
        location.origin,
      );
  }, [comment, store.state.feedback, loaded, local, version]);
  return (
    <section className="section-page staging-page">
      <PreviewLinkCard store={reviewStore} />
      <div className={`staging-review-layout ${reviewStore.state.url ? "with-client-review" : ""}`}>
      <div className="staging-preview-column">
      <div className="staging-summary">
        <div>
          <span className="eyebrow">
            {local ? "DEMO STAGING" : "CONNECTED STAGING"}
          </span>
          <h2>
            {local
              ? "The next version, taking shape."
              : "Your connected preview."}
          </h2>
          <p>
            {local
              ? "FABRIPASS · Build #41 · October 4, 2026, 9:52 AM Dhaka"
              : "Explore the latest work, then share your thoughts alongside it."}
          </p>
        </div>
        <span className="status green">
          <i />
          {!local ? "Preview link saved" : loaded ? "Preview loaded" : "Loading preview"}
        </span>
      </div>
      <div className="preview-toolbar">
        <Tabs value={device} onValueChange={value => setDevice(value as PreviewComment["device"])}>
          <TabsList>
            {[
              { id: "desktop", label: "Desktop", icon: Monitor },
              { id: "tablet", label: "Tablet", icon: Tablet },
              { id: "mobile", label: "Mobile", icon: Smartphone },
            ].map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id} aria-label={`${label} preview`}>
                <Icon size={15} />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="preview-actions">
          <button
            className={`secondary-button ${comment ? "comment-active" : ""}`}
            aria-pressed={local ? comment : undefined}
            onClick={() => {
              if (local) setComment(!comment);
              else document.querySelector<HTMLTextAreaElement>(".client-feedback-input")?.focus();
            }}
          >
            <MessageSquare size={15} />
            <span>{!local ? "Leave feedback" : comment ? "Comment mode on" : "Comment mode"}</span>
          </button>
          <button
            className="icon-button"
            aria-label="Refresh preview"
            onClick={() => {
              setVersion((v) => v + 1);
              setLoaded(false);
            }}
          >
            <RefreshCw size={16} />
          </button>
          <a
            className="icon-button"
            aria-label="Open full preview"
            href={source}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
      {comment && (
        <div className="comment-mode-hint">
          <MessageSquare size={15} />
          Select any heading, section or passport card to add feedback.
        </div>
      )}
      <div className={`browser-stage device-${device}`}>
        <div className="browser-window">
          <div className="browser-chrome">
            <span className="browser-dots">
              <i />
              <i />
              <i />
            </span>
            <div>
              <Lock size={10} />
              <span>{local ? "fabri.demo / staging" : source}</span>
            </div>
            <Globe size={12} />
          </div>
          <iframe
            key={`${source}-${version}`}
            ref={frame}
            title={`${store.state.settings.name} ${device} staging preview`}
            src={source}
            onLoad={() => setLoaded(true)}
            sandbox="allow-scripts allow-same-origin allow-forms"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
      <div className="preview-footnote">
        <span>
          {local
            ? "Comments follow the element when you switch devices."
            : "Preview blank or asking for sign-in? Open it in a new tab, then leave your feedback here."}
        </span>
        <a href={source} target="_blank" rel="noreferrer">
          Open full preview <ExternalLink size={12} />
        </a>
      </div>
      {local && <div className="staging-comments">
        <h3>
          {store.state.feedback.filter((f) => f.status === "Pending").length}{" "}
          open comments
        </h3>
        <button className="text-button" onClick={() => onNavigate("Feedback")}>
          Review all feedback
        </button>
      </div>}
      </div>
      {reviewStore.state.url && <PreviewDiscussion store={reviewStore} device={device} />}
      </div>
      <FeedbackComposer pin={pin} onClose={() => setPin(null)} store={store} />
    </section>
  );
}
