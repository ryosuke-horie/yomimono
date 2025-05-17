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
	 * 要約がないブックマークを取得します。
	 * @param limit 取得件数の上限
	 * @param orderBy ソート順（createdAt または readAt）
	 * @param offset 取得開始位置
	 * @returns 要約がないブックマークのリスト
	 */
	getBookmarksWithoutSummary(
		limit?: number,
		orderBy?: "createdAt" | "readAt",
		offset?: number,
	): Promise<BookmarkWithLabel[]>;

	/**
	 * 既読のブックマークを取得します。
	 * @returns 既読のブックマーク配列
	 */
	getReadBookmarks(): Promise<BookmarkWithLabel[]>;
}
