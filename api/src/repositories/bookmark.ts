import type { DrizzleD1Database } from "drizzle-orm/d1";
import { bookmarks } from "../db/schema";
import type { InsertBookmark } from "../db/schema";

export interface BookmarkRepository {
	createMany(bookmarks: InsertBookmark[]): Promise<void>;
}

export class DrizzleBookmarkRepository implements BookmarkRepository {
	constructor(private readonly db: DrizzleD1Database) {}

	async createMany(newBookmarks: InsertBookmark[]): Promise<void> {
		try {
			if (newBookmarks.length === 0) {
				return;
			}

			// 順次処理に変更
			await Promise.all(
				newBookmarks.map((bookmark) =>
					this.db.insert(bookmarks).values(bookmark),
				),
			);
		} catch (error) {
			console.error("Failed to create bookmarks:", error);
			throw error;
		}
	}
}
