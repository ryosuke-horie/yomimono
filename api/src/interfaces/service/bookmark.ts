import type { Bookmark } from "../../db/schema";
import type { BookmarkWithLabel } from "../repository/bookmark";

export interface IBookmarkService {
	createBookmarksFromData(
		bookmarks: Array<{ url: string; title: string }>,
	): Promise<void>;
	getUnreadBookmarks(): Promise<BookmarkWithLabel[]>;
	markBookmarkAsRead(id: number): Promise<void>;
	markBookmarkAsUnread(id: number): Promise<void>;
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
	 * 評価が存在しないブックマークを取得します。
	 * @returns 未評価のブックマーク配列
	 */
	getUnratedBookmarks(): Promise<BookmarkWithLabel[]>;
}
