import type { BookmarkWithFavorite, InsertBookmark } from "../../db/schema";

export interface IBookmarkRepository {
	createMany(bookmarks: InsertBookmark[]): Promise<void>;
	findUnread(): Promise<BookmarkWithFavorite[]>;
	findByUrls(urls: string[]): Promise<BookmarkWithFavorite[]>;
	markAsRead(id: number): Promise<boolean>;
	markAsUnread(id: number): Promise<boolean>;
	countUnread(): Promise<number>;
	countTodayRead(): Promise<number>;
	addToFavorites(bookmarkId: number): Promise<void>;
	removeFromFavorites(bookmarkId: number): Promise<void>;
	getFavoriteBookmarks(
		offset: number,
		limit: number,
	): Promise<{
		bookmarks: BookmarkWithFavorite[];
		total: number;
	}>;
	isFavorite(bookmarkId: number): Promise<boolean>;
	findRecentlyRead(): Promise<BookmarkWithFavorite[]>;

	/**
	 * 指定されたIDのブックマークを取得します。
	 * @param id ブックマークID
	 * @returns ブックマークオブジェクト（お気に入り情報付き）、存在しない場合はundefined
	 */
	findById(id: number): Promise<BookmarkWithFavorite | undefined>;

	/**
	 * 指定されたIDのブックマークを一括で取得します。
	 * @param ids ブックマークIDの配列
	 * @returns ブックマークのマップ（ID => BookmarkWithFavorite）
	 */
	findByIds(ids: number[]): Promise<Map<number, BookmarkWithFavorite>>;
}
