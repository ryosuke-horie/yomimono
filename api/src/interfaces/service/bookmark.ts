import type { Bookmark } from "../../db/schema"; // Import Bookmark
import type { BookmarkWithLabel } from "../repository/bookmark"; // Corrected import path again

export interface IBookmarkService { // Rename to IBookmarkService
	createBookmarksFromData(
		bookmarks: Array<{ url: string; title: string }>,
	): Promise<void>;
	getUnreadBookmarks(): Promise<BookmarkWithLabel[]>; // Update return type
	markBookmarkAsRead(id: number): Promise<void>;
	getUnreadBookmarksCount(): Promise<number>;
	getTodayReadCount(): Promise<number>;
	addToFavorites(bookmarkId: number): Promise<void>;
	removeFromFavorites(bookmarkId: number): Promise<void>;
	getFavoriteBookmarks(
		page?: number,
		limit?: number,
	): Promise<{
		bookmarks: BookmarkWithLabel[]; // Update return type
		pagination: {
			currentPage: number;
			totalPages: number;
			totalItems: number;
		};
	}>;
	getRecentlyReadBookmarks(): Promise<{
		[date: string]: BookmarkWithLabel[]; // Update return type in map value
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
}
