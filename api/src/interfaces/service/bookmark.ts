import type { BookmarkWithFavorite } from "../repository/bookmark";

export interface BookmarkService {
	createBookmarksFromData(
		bookmarks: Array<{ url: string; title: string }>,
	): Promise<void>;
	getUnreadBookmarks(): Promise<BookmarkWithFavorite[]>;
	markBookmarkAsRead(id: number): Promise<void>;
	getUnreadBookmarksCount(): Promise<number>;
	getTodayReadCount(): Promise<number>;
	addToFavorites(bookmarkId: number): Promise<void>;
	removeFromFavorites(bookmarkId: number): Promise<void>;
	getFavoriteBookmarks(
		page?: number,
		limit?: number,
	): Promise<{
		bookmarks: BookmarkWithFavorite[];
		pagination: {
			currentPage: number;
			totalPages: number;
			totalItems: number;
		};
	}>;
	getRecentlyReadBookmarks(): Promise<{
		[date: string]: BookmarkWithFavorite[];
	}>;
}
