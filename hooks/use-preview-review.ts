"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { emptyPreviewReview, type PreviewAction, type PreviewReview } from "@/lib/preview-review";

export function usePreviewReview() {
  const [state, setState] = useState(emptyPreviewReview);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const accept = useCallback((next: PreviewReview) => {
    setState(previous => next.revision >= previous.revision ? next : previous);
    setReady(true);
    setError("");
  }, []);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/preview-review", { cache: "no-store" });
      const data = await response.json() as PreviewReview & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not load the review space.");
      accept(data);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not load the review space."); }
  }, [accept]);
  useEffect(() => {
    void refresh();
    const poll = setInterval(() => { if (!document.hidden && !saving.current) void refresh(); }, 15000);
    const onFocus = () => { if (!saving.current) void refresh(); };
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(poll); window.removeEventListener("focus", onFocus); };
  }, [refresh]);
  const send = async (action: PreviewAction) => {
    if (!ready || saving.current) return false;
    saving.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/preview-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action) });
      const data = await response.json() as PreviewReview & { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save. Your input is still here.");
      accept(data);
      toast.success(action.type === "connect" ? "Preview link saved" : action.type === "comment" ? "Feedback posted" : action.type === "reply" ? "Reply posted" : "Feedback updated");
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save. Your input is still here.");
      return false;
    } finally { saving.current = false; setBusy(false); }
  };
  return { state, ready, error, busy, refresh, send };
}
export type PreviewReviewStore = ReturnType<typeof usePreviewReview>;
