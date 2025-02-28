import type { DrizzleD1Database } from "drizzle-orm/d1";
import { bookmarks } from "../db/schema";
import type { InsertBookmark } from "../db/schema";

export interface BookmarkRepository {
	createMany(bookmarks: InsertBookmark[]): Promise<void>;
}

export class DrizzleBookmarkRepository implements BookmarkRepository {
	constructor(private readonly db: DrizzleD1Database) {}

	async createMany(newBookmarks: InsertBookmark[]): Promise<void> {
		await this.db.insert(bookmarks).values(newBookmarks);
	}
}
