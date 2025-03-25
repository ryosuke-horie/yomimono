import type { Bookmark, InsertBookmark } from "../db/schema";
import type { BookmarkRepository } from "../repositories/bookmark";

export interface BookmarkService {
	createBookmarksFromData(
		bookmarks: Array<{ url: string; title: string }>,
	): Promise<void>;
	getUnreadBookmarks(): Promise<Bookmark[]>;
	markBookmarkAsRead(id: number): Promise<void>;
	getUnreadBookmarksCount(): Promise<number>;
}

export class DefaultBookmarkService implements BookmarkService {
	constructor(private readonly repository: BookmarkRepository) {}

	async getUnreadBookmarksCount(): Promise<number> {
		return await this.repository.countUnread();
	}

	async getUnreadBookmarks(): Promise<Bookmark[]> {
		return await this.repository.findUnread();
	}

	async createBookmarksFromData(
		bookmarks: Array<{ url: string; title: string }>,
	): Promise<void> {
		// 既存のブックマークをURLで検索
		const existingBookmarks = await this.repository.findByUrls(
			bookmarks.map((b) => b.url),
		);

		// 重複かつ未読の記事は除外して登録対象を決定
		const bookmarksToInsert = bookmarks
			.filter(({ url }) => {
				const existing = existingBookmarks.find((b) => b.url === url);
				return !existing || existing.isRead; // 存在しないか既読の場合のみ登録
			})
			.map(
				({ url, title }) =>
					({
						url,
						title: title || null,
						isRead: false,
						createdAt: new Date(),
						updatedAt: new Date(),
					}) satisfies InsertBookmark,
			);

		if (bookmarksToInsert.length > 0) {
			await this.repository.createMany(bookmarksToInsert);
		}
	}

	async markBookmarkAsRead(id: number): Promise<void> {
		const updated = await this.repository.markAsRead(id);
		if (!updated) {
			throw new Error("Bookmark not found");
		}
	}
}
