import { z } from "zod";

export const previewUrlSchema = z.string().trim().max(2048).refine((value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}, "Enter a full HTTPS preview link, such as https://your-project.vercel.app");

const message = z.string().trim().min(1, "Please write a message.").max(3000);
export const previewActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("connect"), url: previewUrlSchema, update: z.string().trim().max(600) }),
  z.object({ type: z.literal("comment"), id: z.string().uuid(), url: previewUrlSchema, kind: z.enum(["Suggestion", "Issue", "Feedback"]), page: z.string().trim().min(1).max(160), device: z.enum(["desktop", "tablet", "mobile"]), text: message }),
  z.object({ type: z.literal("reply"), id: z.string().uuid(), commentId: z.string().uuid(), text: message }),
  z.object({ type: z.literal("status"), id: z.string().uuid(), status: z.enum(["Open", "Resolved"]) }),
]);
export type PreviewAction = z.infer<typeof previewActionSchema>;
export type PreviewComment = {
  id: string; url: string; kind: "Suggestion" | "Issue" | "Feedback";
  page: string; device: "desktop" | "tablet" | "mobile"; text: string;
  author: string; created: string; status: "Open" | "Resolved";
  replies: { id: string; text: string; author: string; created: string }[];
};
export type PreviewReview = {
  url: string; update: string; updated: string; updatedBy: string;
  comments: PreviewComment[]; revision: number; canManage: boolean;
};
export const emptyPreviewReview: PreviewReview = {
  url: "", update: "", updated: "", updatedBy: "", comments: [], revision: 0, canManage: true,
};
