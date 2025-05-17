import type { Bookmark } from "../../db/schema";
import type { BookmarkWithLabel } from "../repository/bookmark";

export interface IBookmarkService {
	createBookmarksFromData(
		bookmarks: Array<{ url: string; title: string }>,
	): Promise<void>;
	getUnreadBookmarks(): Promise<BookmarkWithLabel[]>;
	markBookmarkAsRead(id: number): Promise<void>;
	getUnreadBookmarksCount(): Promise<number>;
	getTodayReadCount(): Promise<number>;
	addToFavorites(bookmarkId: number): Promise<void>;
	removeFromFavorites(bookmarkId: number): Promise<void>;
	getFavoriteBookmarks(): Promise<{
		bookmarks: BookmarkWithLabel[];
	}>;
	getRecentlyReadBookmarks(): Promise<{
		[date: string]: BookmarkWithLabel[];
	}>;

	/**
	 * 未ラベルのブックマークを取得します。
	 * @returns 未ラベルのブックマーク配列
	 */
	getUnlabeledBookmarks(): Promise<Bookmark[]>;

	/**
	 * 指定されたラベル名に紐づくブックマークを取得します。
	 * @param labelName ラベル名（正規化済みである必要あり）
	 * @returns ラベルに紐づくブックマーク配列
	 */
	getBookmarksByLabel(labelName: string): Promise<BookmarkWithLabel[]>;

	/**
	 * 要約が未作成のブックマークを取得します。
	 * @param limit 取得件数制限
	 * @returns 要約なしのブックマーク配列
	 */
	getBookmarksWithoutSummary(limit?: number): Promise<BookmarkWithLabel[]>;

	/**
	 * ブックマークの要約を更新します。
	 * @param bookmarkId ブックマークID
	 * @param summary 要約文
	 */
	updateBookmarkSummary(bookmarkId: number, summary: string): Promise<void>;
}
