import type { InsertBookmark } from "../db/schema";
import type {
	BookmarkRepository,
	BookmarkWithFavorite,
} from "../interfaces/repository/bookmark";
import type { BookmarkService } from "../interfaces/service/bookmark";

export class DefaultBookmarkService implements BookmarkService {
	constructor(private readonly repository: BookmarkRepository) {}

	async getUnreadBookmarksCount(): Promise<number> {
		return await this.repository.countUnread();
	}

	async getTodayReadCount(): Promise<number> {
		return await this.repository.countTodayRead();
	}

	async getUnreadBookmarks(): Promise<BookmarkWithFavorite[]> {
		return await this.repository.findUnread();
	}

	async addToFavorites(bookmarkId: number): Promise<void> {
		try {
			await this.repository.addToFavorites(bookmarkId);
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error("Failed to add to favorites");
		}
	}

	async removeFromFavorites(bookmarkId: number): Promise<void> {
		try {
			await this.repository.removeFromFavorites(bookmarkId);
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new Error("Failed to remove from favorites");
		}
	}

	async getFavoriteBookmarks(
		page = 1,
		limit = 20,
	): Promise<{
		bookmarks: BookmarkWithFavorite[];
		pagination: {
			currentPage: number;
			totalPages: number;
			totalItems: number;
		};
	}> {
		try {
			const offset = (page - 1) * limit;
			const { bookmarks, total } = await this.repository.getFavoriteBookmarks(
				offset,
				limit,
			);

			const totalPages = Math.ceil(total / limit);

			return {
				bookmarks,
				pagination: {
					currentPage: page,
					totalPages,
					totalItems: total,
				},
			};
		} catch (error) {
			console.error("Failed to get favorite bookmarks:", error);
			throw new Error("Failed to get favorite bookmarks");
		}
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
