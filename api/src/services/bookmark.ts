import type { Bookmark, InsertBookmark } from "../db/schema";
import type { BookmarkRepository } from "../repositories/bookmark";

export interface BookmarkService {
	createBookmarksFromData(
		bookmarks: Array<{ url: string; title: string }>,
	): Promise<void>;
	getUnreadBookmarks(): Promise<Bookmark[]>;
	markBookmarkAsRead(id: number): Promise<void>;
}

export class DefaultBookmarkService implements BookmarkService {
	constructor(private readonly repository: BookmarkRepository) {}

	async getUnreadBookmarks(): Promise<Bookmark[]> {
		return await this.repository.findUnread();
	}

	async createBookmarksFromData(
		bookmarks: Array<{ url: string; title: string }>,
	): Promise<void> {
		const bookmarksToInsert = bookmarks.map(
			({ url, title }) =>
				({
					url,
					title: title || null,
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
				}) satisfies InsertBookmark,
		);

		await this.repository.createMany(bookmarksToInsert);
	}

	async markBookmarkAsRead(id: number): Promise<void> {
		await this.repository.markAsRead(id);
	}
}
