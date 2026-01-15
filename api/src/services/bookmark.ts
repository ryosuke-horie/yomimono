import { CONFIG } from "../config";
import type { InsertBookmark } from "../db/schema";
import { InternalServerError, NotFoundError } from "../exceptions";
import type {
	BookmarkWithLabel,
	IBookmarkRepository,
} from "../interfaces/repository/bookmark";
import type { IBookmarkService } from "../interfaces/service/bookmark";
import { groupByDate } from "../utils/timezone";

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
			throw new InternalServerError("Failed to add to favorites");
		}
	}

	async removeFromFavorites(bookmarkId: number): Promise<void> {
		try {
			await this.repository.removeFromFavorites(bookmarkId);
		} catch (error) {
			if (error instanceof Error) {
				throw error;
			}
			throw new InternalServerError("Failed to remove from favorites");
		}
	}

	async getFavoriteBookmarks(): Promise<{
		bookmarks: BookmarkWithLabel[];
	}> {
		try {
			// 個人ツールではページネーション不要のため、全件取得
			const { bookmarks } = await this.repository.getFavoriteBookmarks(
				CONFIG.pagination.defaultOffset,
				CONFIG.limits.maxFavorites,
			);

			return {
				bookmarks,
			};
		} catch (error) {
			console.error("Failed to get favorite bookmarks:", error);
			throw new InternalServerError("Failed to get favorite bookmarks");
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
			throw new NotFoundError("ブックマークが見つかりません");
		}
	}

	async markBookmarkAsUnread(id: number): Promise<void> {
		const updated = await this.repository.markAsUnread(id);
		if (!updated) {
			throw new NotFoundError("ブックマークが見つかりません");
		}
	}

	async getRecentlyReadBookmarks(): Promise<{
		[date: string]: BookmarkWithLabel[];
	}> {
		try {
			const bookmarks = await this.repository.findRecentlyRead();

			// タイムゾーンユーティリティを使用して日付でグループ化
			return groupByDate(bookmarks);
		} catch (error) {
			console.error("Failed to get recently read bookmarks:", error);
			throw new InternalServerError("Failed to get recently read bookmarks");
		}
	}

	async getBookmarksByLabel(labelName: string): Promise<BookmarkWithLabel[]> {
		try {
			// Note: labelNameは正規化済みである必要があります。
			// このサービスメソッドを呼び出す前に正規化してください。
			return await this.repository.findByLabelName(labelName);
		} catch (error) {
			console.error("Failed to get bookmarks by label:", error);
			throw new InternalServerError("Failed to get bookmarks by label");
		}
	}
}
