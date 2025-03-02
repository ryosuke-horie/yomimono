import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { bookmarks } from "../db/schema";
import type { Bookmark, InsertBookmark } from "../db/schema";

export interface BookmarkRepository {
	createMany(bookmarks: InsertBookmark[]): Promise<void>;
	findUnread(): Promise<Bookmark[]>;
	markAsRead(id: number): Promise<boolean>;
}

export class DrizzleBookmarkRepository implements BookmarkRepository {
	constructor(private readonly db: DrizzleD1Database) {}

	async findUnread(): Promise<Bookmark[]> {
		try {
			return await this.db
				.select()
				.from(bookmarks)
				.where(eq(bookmarks.isRead, false))
				.all();
		} catch (error) {
			console.error("Failed to fetch unread bookmarks:", error);
			throw error;
		}
	}

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

	async markAsRead(id: number): Promise<boolean> {
		try {
			// 存在確認
			const bookmark = await this.db
				.select()
				.from(bookmarks)
				.where(eq(bookmarks.id, id))
				.get();

			if (!bookmark) {
				return false;
			}

			const result = await this.db
				.update(bookmarks)
				.set({
					isRead: true,
					updatedAt: new Date(),
				})
				.where(eq(bookmarks.id, id))
				.run();

			return true;
		} catch (error) {
			console.error("Failed to mark bookmark as read:", error);
			throw error;
		}
	}
}
