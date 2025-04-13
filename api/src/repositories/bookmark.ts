import { and, count, eq, gte, inArray, isNull } from "drizzle-orm"; // Removed leftJoin from import
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
	bookmarks,
	favorites,
	labels,
	articleLabels,
	type Bookmark,
	type InsertBookmark,
	type Label,
} from "../db/schema";
import type {
	IBookmarkRepository, // Updated interface name
	BookmarkWithFavorite,
	BookmarkWithLabel, // New type
} from "../interfaces/repository/bookmark";
import { drizzle } from "drizzle-orm/d1"; // Import drizzle on its own line

export class DrizzleBookmarkRepository implements IBookmarkRepository { // Implement updated interface
	private readonly db: DrizzleD1Database; // Keep internal db as DrizzleD1Database

	constructor(db: D1Database) { // Accept D1Database in constructor
		this.db = drizzle(db); // Wrap with drizzle
	}

	// お気に入りフラグとラベル情報を含むブックマーク情報を取得するヘルパーメソッド
	private async attachLabelAndFavoriteStatus(
		baseQuery: any, // DrizzleのSelectQueryBuilderを受け取る想定
	): Promise<BookmarkWithLabel[]> {
		const results = await baseQuery
			.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
			.leftJoin(articleLabels, eq(bookmarks.id, articleLabels.articleId))
			.leftJoin(labels, eq(articleLabels.labelId, labels.id))
			.all();

		// Use the keys defined in the select clause ('bookmark', 'favorite', 'label')
		return results.map((row: any) => ({
			...row.bookmark, // Use singular 'bookmark'
			isFavorite: !!row.favorite, // Use singular 'favorite'
			label: row.label ? { ...row.label } : null, // Use singular 'label'
		}));
	}

	async findByUrls(urls: string[]): Promise<BookmarkWithLabel[]> { // Return type updated
		try {
			if (urls.length === 0) {
				return [];
			}
			const query = this.db
				.select()
				.from(bookmarks)
				.where(inArray(bookmarks.url, urls));
			return this.attachLabelAndFavoriteStatus(query); // Use new helper
		} catch (error) {
			console.error("Failed to find bookmarks by URLs:", error);
			throw error;
		}
	}
	// countUnread, countTodayReadは変更なし
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

	async countTodayRead(): Promise<number> {
		try {
			// 日本時間の当日0時のタイムスタンプを取得
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			// UTC+9の考慮
			today.setHours(today.getHours() - 9);

			const result = await this.db
				.select({ count: count() })
				.from(bookmarks)
				.where(and(eq(bookmarks.isRead, true), gte(bookmarks.updatedAt, today)))
				.get();

			return result?.count || 0;
		} catch (error) {
			console.error("Failed to count today's read bookmarks:", error);
			throw error;
		}
	}

	async findUnread(): Promise<BookmarkWithLabel[]> { // Return type updated
		try {
			const query = this.db
				.select()
				.from(bookmarks)
				.where(eq(bookmarks.isRead, false));
			return this.attachLabelAndFavoriteStatus(query); // Use new helper
		} catch (error) {
			console.error("Failed to fetch unread bookmarks:", error);
			throw error;
		}
	}
	// createMany, markAsRead, addToFavorites, removeFromFavorites, isFavoriteは変更なし
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
		bookmarks: BookmarkWithLabel[]; // Return type updated
		total: number;
	}> {
		try {
			const total = await this.db
				.select({ count: count() })
				.from(favorites)
				.get()
				.then((result) => result?.count || 0);

			const query = this.db
				.select()
				.from(bookmarks)
				.innerJoin(favorites, eq(bookmarks.id, favorites.bookmarkId)) // favoritesは必須
				.limit(limit)
				.offset(offset);

			const bookmarksWithLabelAndFavorite =
				await this.attachLabelAndFavoriteStatus(query); // Use new helper

			return {
				bookmarks: bookmarksWithLabelAndFavorite,
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

	async findRecentlyRead(): Promise<BookmarkWithLabel[]> { // Return type updated
		try {
			const threeDaysAgo = new Date();
			threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
			// UTC+9の考慮
			threeDaysAgo.setHours(threeDaysAgo.getHours() - 9);

			const query = this.db
				.select()
				.from(bookmarks)
				.where(
					and(
						eq(bookmarks.isRead, true),
						gte(bookmarks.updatedAt, threeDaysAgo),
					),
				)
				.orderBy(bookmarks.updatedAt);

			return this.attachLabelAndFavoriteStatus(query); // Use new helper
		} catch (error) {
			console.error("Failed to fetch recently read bookmarks:", error);
			throw error;
		}
	}

	// --- New methods ---
	async findUnlabeled(): Promise<Bookmark[]> {
		try {
			const results = await this.db
				.select({ bookmarks: bookmarks }) // Select only bookmark fields
				.from(bookmarks)
				.leftJoin(articleLabels, eq(bookmarks.id, articleLabels.articleId))
				.where(isNull(articleLabels.id)) // Filter where no label exists
				.all();
			return results.map(r => r.bookmarks); // Extract bookmark data
		} catch (error) {
			console.error("Failed to fetch unlabeled bookmarks:", error);
			throw error;
		}
	}

	async findByLabelName(labelName: string): Promise<BookmarkWithLabel[]> {
		try {
			// Perform all necessary joins directly here
			const results = await this.db
				.select({ // Select specific fields from each table
					bookmark: bookmarks,
					favorite: favorites, // Select the whole favorite object (or null)
					label: labels,       // Select the whole label object
				})
				.from(bookmarks)
				.innerJoin(articleLabels, eq(bookmarks.id, articleLabels.articleId)) // Must have a label association
				.innerJoin(labels, eq(articleLabels.labelId, labels.id))          // Must have a label
				.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))      // Favorite is optional
				.where(eq(labels.name, labelName)) // Filter by label name
				.all();

			// Manually map the results to the BookmarkWithLabel structure
			return results.map(row => ({
				...row.bookmark,
				isFavorite: !!row.favorite, // Check if favorite exists
				label: row.label,          // Label is guaranteed by inner join
			}));
		} catch (error) {
			console.error("Failed to fetch bookmarks by label name:", error);
			throw error;
		}
	}

	async findById(id: number): Promise<BookmarkWithLabel | undefined> {
		try {
			const query = this.db
				.select()
				.from(bookmarks)
				.where(eq(bookmarks.id, id));

			const results = await this.attachLabelAndFavoriteStatus(query); // Use helper
			return results.length > 0 ? results[0] : undefined;
		} catch (error) {
			console.error(`Failed to fetch bookmark by id ${id}:`, error);
			throw error;
		}
	}
}
