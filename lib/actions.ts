import { z } from "zod";
const text = z.string().trim().min(1).max(3000);
export const actionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("approval"),
    id: z.string().max(80),
    status: z.enum(["Approved", "Changes requested", "Awaiting approval"]),
    note: z.string().trim().max(3000).optional(),
  }),
  z.object({
    type: z.literal("feedback-add"),
    id: z.string().uuid(),
    target: z.string().min(1).max(100),
    text,
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  }),
  z.object({
    type: z.literal("feedback-status"),
    id: z.string().max(80),
    status: z.enum(["Resolved", "Pending"]),
  }),
  z.object({ type: z.literal("feedback-reply"), id: z.string().max(80), text }),
  z.object({
    type: z.literal("decision"),
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(120),
    body: text,
    kind: z.enum(["Decision", "Meeting", "Client request", "Scope change"]),
  }),
  z.object({
    type: z.literal("settings"),
    name: z.string().trim().min(1).max(60),
    notifications: z.boolean(),
    motion: z.boolean(),
    stagingUrl: z
      .string()
      .max(2048)
      .refine(
        (s) => {
          if (s === "/preview.html") return true;
          try { const url = new URL(s); return url.protocol === 'https:' && !url.username && !url.password; }
          catch { return false; }
        },
        "Use an HTTPS address",
      ),
  }),
]);
export type ProjectAction = z.infer<typeof actionSchema>;
