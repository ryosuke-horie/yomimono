import type { Bookmark, InsertBookmark } from "../../db/schema";

export type BookmarkWithFavorite = Bookmark & { isFavorite: boolean };

export interface BookmarkRepository {
	createMany(bookmarks: InsertBookmark[]): Promise<void>;
	findUnread(): Promise<BookmarkWithFavorite[]>;
	findByUrls(urls: string[]): Promise<BookmarkWithFavorite[]>;
	markAsRead(id: number): Promise<boolean>;
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
}
