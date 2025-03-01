import type { InsertBookmark } from "../db/schema";
import type { BookmarkRepository } from "../repositories/bookmark";

export interface BookmarkService {
	createBookmarksFromData(
		bookmarks: Array<{ url: string; title: string }>,
	): Promise<void>;
}

export class DefaultBookmarkService implements BookmarkService {
	constructor(private readonly repository: BookmarkRepository) {}

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
}
