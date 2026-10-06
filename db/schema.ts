import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const portalState = sqliteTable("portal_state", {
  owner: text("owner").primaryKey(),
  data: text("data").notNull(),
  revision: integer("revision").notNull().default(0),
});
export const previewReviews = sqliteTable("preview_reviews", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
  revision: integer("revision").notNull().default(0),
});
