"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { initialState, ProjectState } from "@/lib/project-data";
import { ProjectAction } from "@/lib/actions";
export function useProject() {
  const [state, setState] = useState<ProjectState>(initialState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const accept = useCallback(
    (next: ProjectState) =>
      setState((prev) => (next.revision >= prev.revision ? next : prev)),
    [],
  );
  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/project", { cache: "no-store" });
      const data = (await r.json()) as ProjectState & { error?: string };
      if (!r.ok) throw Error(data.error || "Unable to load this project.");
      accept(data);
      setReady(true);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to connect. Please try again.",
      );
    }
  }, [accept]);
  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      if (!document.hidden && !saving.current) refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [refresh]);
  const send = async (body: ProjectAction | FormData) => {
    if (saving.current || !ready) return false;
    saving.current = true;
    setBusy(true);
    try {
      const file = body instanceof FormData;
      const r = await fetch(file ? "/api/assets" : "/api/project", {
        method: "POST",
        headers: file ? undefined : { "Content-Type": "application/json" },
        body: file ? body : JSON.stringify(body),
      });
      const data = (await r.json()) as ProjectState & { error?: string };
      if (!r.ok) throw Error(data.error || "Could not save. Please try again.");
      accept(data);
      toast.success(file ? "Asset uploaded" : "Changes saved");
      return true;
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Could not save. Your input has been kept.",
      );
      return false;
    } finally {
      setBusy(false);
      saving.current = false;
    }
  };
  return { state, ready, error, busy, refresh, send };
}
export type ProjectStore = ReturnType<typeof useProject>;
