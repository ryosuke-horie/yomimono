import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    url: text("url").notNull(),
    title: text("title"),
    isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(new Date()),
  },
  (table) => ({
    urlIdx: uniqueIndex("idx_bookmarks_url").on(table.url),
    createdAtIdx: uniqueIndex("idx_bookmarks_created_at").on(table.createdAt),
    isReadIdx: uniqueIndex("idx_bookmarks_is_read").on(table.isRead),
  }),
);

// TypeScript type for the bookmarks table
export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;