import type { Bookmark, InsertBookmark } from "../db/schema";
import type {
	BookmarkWithLabel,
	IBookmarkRepository,
} from "../interfaces/repository/bookmark";
import type { IBookmarkService } from "../interfaces/service/bookmark";

export class DefaultBookmarkService implements IBookmarkService {
	constructor(private readonly repository: IBookmarkRepository) {}

	async getUnreadBookmarksCount(): Promise<number> {
		return await this.repository.countUnread();
	}

	async getTodayReadCount(): Promise<number> {
		return await this.repository.countTodayRead();
	}

	async getUnreadBookmarks(): Promise<BookmarkWithLabel[]> {
		// Update return type
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

	async getFavoriteBookmarks(): Promise<{
		bookmarks: BookmarkWithLabel[];
	}> {
		try {
			// 個人ツールではページネーション不要のため、全件取得
			const { bookmarks, total } = await this.repository.getFavoriteBookmarks(
				0,
				1000,
			);

			return {
				bookmarks,
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
		[date: string]: BookmarkWithLabel[];
	}> {
		try {
			const bookmarks = await this.repository.findRecentlyRead();

			const groupedByDate: { [date: string]: BookmarkWithLabel[] } = {};

			for (const bookmark of bookmarks) {
				if (
					!(bookmark.updatedAt instanceof Date) ||
					Number.isNaN(bookmark.updatedAt.getTime())
				) {
					console.warn(
						`Invalid updatedAt value found for bookmark ID ${bookmark.id}:`,
						bookmark.updatedAt,
					);
					continue;
				}

				const date = new Date(bookmark.updatedAt);
				date.setHours(date.getHours() + 9); // JSTに変換

				// 日付が無効な場合はスキップ
				if (Number.isNaN(date.getTime())) {
					console.warn(
						`Invalid date after timezone adjustment for bookmark ID ${bookmark.id}:`,
						bookmark.updatedAt,
					);
					continue;
				}

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
			// Note: labelNameは正規化済みである必要があります。
			// このサービスメソッドを呼び出す前に正規化してください。
			return await this.repository.findByLabelName(labelName);
		} catch (error) {
			console.error("Failed to get bookmarks by label:", error);
			throw new Error("Failed to get bookmarks by label");
		}
	}

	async getBookmarksWithoutSummary(
		limit = 10,
		orderBy: "createdAt" | "readAt" = "createdAt",
		offset = 0,
	): Promise<BookmarkWithLabel[]> {
		try {
			return await this.repository.findWithoutSummary(limit, orderBy, offset);
		} catch (error) {
			console.error("Failed to get bookmarks without summary:", error);
			throw new Error("Failed to get bookmarks without summary");
		}
	}
}
