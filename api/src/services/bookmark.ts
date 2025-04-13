import type { Bookmark, InsertBookmark } from "../db/schema"; // Import Bookmark
import type {
	IBookmarkRepository, // Use IBookmarkRepository
	BookmarkWithLabel, // Use BookmarkWithLabel
} from "../interfaces/repository/bookmark";
import type { IBookmarkService } from "../interfaces/service/bookmark"; // Use IBookmarkService

export class DefaultBookmarkService implements IBookmarkService { // Implement IBookmarkService
	constructor(private readonly repository: IBookmarkRepository) {} // Use IBookmarkRepository

	async getUnreadBookmarksCount(): Promise<number> {
		return await this.repository.countUnread();
	}

	async getTodayReadCount(): Promise<number> {
		return await this.repository.countTodayRead();
	}

	async getUnreadBookmarks(): Promise<BookmarkWithLabel[]> { // Update return type
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
		bookmarks: BookmarkWithLabel[]; // Update return type
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
	// createBookmarksFromDataは変更なし (findByUrlsの戻り値型が変わったが、ロジックは影響なし)
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
	// markBookmarkAsReadは変更なし
	async markBookmarkAsRead(id: number): Promise<void> {
		const updated = await this.repository.markAsRead(id);
		if (!updated) {
			throw new Error("Bookmark not found");
		}
	}

	async getRecentlyReadBookmarks(): Promise<{
		[date: string]: BookmarkWithLabel[]; // Update return type in map value
	}> {
		try {
			const bookmarks = await this.repository.findRecentlyRead();

			const groupedByDate: { [date: string]: BookmarkWithLabel[] } = {}; // Update type

			for (const bookmark of bookmarks) {
				const date = new Date(bookmark.updatedAt);
				date.setHours(date.getHours() + 9);

				const dateStr = date.toISOString().split("T")[0];

				if (!groupedByDate[dateStr]) {
					groupedByDate[dateStr] = [];
				}

				groupedByDate[dateStr].push(bookmark);
			}

			return groupedByDate;
		} catch (error) {
			console.error("Failed to get recently read bookmarks:", error);
			throw new Error("Failed to get recently read bookmarks");
		}
	}

	// --- New methods ---
	async getUnlabeledBookmarks(): Promise<Bookmark[]> {
		try {
			return await this.repository.findUnlabeled();
		} catch (error) {
			console.error("Failed to get unlabeled bookmarks:", error);
			throw new Error("Failed to get unlabeled bookmarks");
		}
	}

	async getBookmarksByLabel(labelName: string): Promise<BookmarkWithLabel[]> {
		try {
			// Note: labelName should be normalized before calling this service method if needed.
			// The repository expects a normalized name.
			return await this.repository.findByLabelName(labelName);
		} catch (error) {
			console.error("Failed to get bookmarks by label:", error);
			throw new Error("Failed to get bookmarks by label");
		}
	}
}
