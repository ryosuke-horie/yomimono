import type { BookmarkWithFavorite } from "../repository/bookmark";

export interface IBookmarkService {
	createBookmarksFromData(
		bookmarks: Array<{ url: string; title: string }>,
	): Promise<void>;
	getUnreadBookmarks(): Promise<BookmarkWithFavorite[]>;
	markBookmarkAsRead(id: number): Promise<void>;
	markBookmarkAsUnread(id: number): Promise<void>;
	getUnreadBookmarksCount(): Promise<number>;
	getTodayReadCount(): Promise<number>;
	addToFavorites(bookmarkId: number): Promise<void>;
	removeFromFavorites(bookmarkId: number): Promise<void>;
	getFavoriteBookmarks(): Promise<{
		bookmarks: BookmarkWithFavorite[];
	}>;
	getRecentlyReadBookmarks(): Promise<{
		[date: string]: BookmarkWithFavorite[];
	}>;
}
