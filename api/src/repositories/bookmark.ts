import { and, count, eq, inArray } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { bookmarks, favorites } from "../db/schema";
import type { Bookmark, InsertBookmark, InsertFavorite } from "../db/schema";

// ブックマークの拡張型（お気に入り状態を含む）
export type BookmarkWithFavorite = Bookmark & { isFavorite: boolean };

export interface BookmarkRepository {
	createMany(bookmarks: InsertBookmark[]): Promise<void>;
	findUnread(): Promise<BookmarkWithFavorite[]>;
	findByUrls(urls: string[]): Promise<BookmarkWithFavorite[]>;
	markAsRead(id: number): Promise<boolean>;
	countUnread(): Promise<number>;
	// お気に入り関連の新しいメソッド
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
}

export class DrizzleBookmarkRepository implements BookmarkRepository {
	constructor(private readonly db: DrizzleD1Database) {}

	// お気に入りフラグを含むブックマーク情報を取得するヘルパーメソッド
	private async attachFavoriteStatus<T extends Bookmark[]>(
		bookmarks: T,
	): Promise<(T[number] & { isFavorite: boolean })[]> {
		if (bookmarks.length === 0) return [];

		const bookmarkIds = bookmarks.map((b) => b.id);
		const favoriteRows = await this.db
			.select()
			.from(favorites)
			.where(inArray(favorites.bookmarkId, bookmarkIds))
			.all();

		const favoriteIds = new Set(favoriteRows.map((f) => f.bookmarkId));
		return bookmarks.map((bookmark) => ({
			...bookmark,
			isFavorite: favoriteIds.has(bookmark.id),
		}));
	}

	async findByUrls(urls: string[]): Promise<BookmarkWithFavorite[]> {
		try {
			if (urls.length === 0) {
				return [];
			}
			const results = await this.db
				.select()
				.from(bookmarks)
				.where(inArray(bookmarks.url, urls))
				.all();
			return this.attachFavoriteStatus(results);
		} catch (error) {
			console.error("Failed to find bookmarks by URLs:", error);
			throw error;
		}
	}

	async countUnread(): Promise<number> {
		try {
			const result = await this.db
				.select({ count: count() })
				.from(bookmarks)
				.where(eq(bookmarks.isRead, false))
				.get();

			return result?.count || 0;
		} catch (error) {
			console.error("Failed to count unread bookmarks:", error);
			throw error;
		}
	}

	async findUnread(): Promise<BookmarkWithFavorite[]> {
		try {
			const results = await this.db
				.select()
				.from(bookmarks)
				.where(eq(bookmarks.isRead, false))
				.all();
			return this.attachFavoriteStatus(results);
		} catch (error) {
			console.error("Failed to fetch unread bookmarks:", error);
			throw error;
		}
	}

	async createMany(newBookmarks: InsertBookmark[]): Promise<void> {
		try {
			if (newBookmarks.length === 0) {
				return;
			}

			// 順次処理に変更
			await Promise.all(
				newBookmarks.map((bookmark) =>
					this.db.insert(bookmarks).values(bookmark),
				),
			);
		} catch (error) {
			console.error("Failed to create bookmarks:", error);
			throw error;
		}
	}

	async markAsRead(id: number): Promise<boolean> {
		try {
			// 存在確認
			const bookmark = await this.db
				.select()
				.from(bookmarks)
				.where(eq(bookmarks.id, id))
				.get();

			if (!bookmark) {
				return false;
			}

			await this.db
				.update(bookmarks)
				.set({
					isRead: true,
					updatedAt: new Date(),
				})
				.where(eq(bookmarks.id, id))
				.run();

			return true;
		} catch (error) {
			console.error("Failed to mark bookmark as read:", error);
			throw error;
		}
	}

	async addToFavorites(bookmarkId: number): Promise<void> {
		try {
			// ブックマークの存在確認
			const bookmark = await this.db
				.select()
				.from(bookmarks)
				.where(eq(bookmarks.id, bookmarkId))
				.get();

			if (!bookmark) {
				throw new Error("Bookmark not found");
			}

			// 既にお気に入りに追加されているか確認
			const existing = await this.db
				.select()
				.from(favorites)
				.where(eq(favorites.bookmarkId, bookmarkId))
				.get();

			if (existing) {
				throw new Error("Already favorited");
			}

			// お気に入りに追加
			await this.db.insert(favorites).values({
				bookmarkId,
				createdAt: new Date(),
			});
		} catch (error) {
			console.error("Failed to add to favorites:", error);
			throw error;
		}
	}

	async removeFromFavorites(bookmarkId: number): Promise<void> {
		try {
			const result = await this.db
				.delete(favorites)
				.where(eq(favorites.bookmarkId, bookmarkId))
				.run();

			if (!result.meta?.changes) {
				throw new Error("Favorite not found");
			}
		} catch (error) {
			console.error("Failed to remove from favorites:", error);
			throw error;
		}
	}

	async getFavoriteBookmarks(
		offset: number,
		limit: number,
	): Promise<{
		bookmarks: BookmarkWithFavorite[];
		total: number;
	}> {
		try {
			const [total, favoriteBookmarks] = await Promise.all([
				this.db
					.select({ count: count() })
					.from(favorites)
					.get()
					.then((result) => result?.count || 0),
				this.db
					.select({
						bookmarks: bookmarks,
					})
					.from(bookmarks)
					.innerJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
					.limit(limit)
					.offset(offset)
					.all(),
			]);

			const bookmarksWithFavorites = favoriteBookmarks.map((row) => ({
				...row.bookmarks,
				isFavorite: true,
			}));

			return {
				bookmarks: bookmarksWithFavorites,
				total,
			};
		} catch (error) {
			console.error("Failed to get favorite bookmarks:", error);
			throw error;
		}
	}

	async isFavorite(bookmarkId: number): Promise<boolean> {
		try {
			const result = await this.db
				.select()
				.from(favorites)
				.where(eq(favorites.bookmarkId, bookmarkId))
				.get();

			return !!result;
		} catch (error) {
			console.error("Failed to check favorite status:", error);
			throw error;
		}
	}
}
