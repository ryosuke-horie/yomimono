import { and, count, desc, eq, gte, inArray, type SQL } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";
import { CONFIG } from "../config";
import { bookmarks, favorites, type InsertBookmark } from "../db/schema";
import { ConflictError, NotFoundError } from "../exceptions";
import type {
	BookmarkWithFavorite,
	IBookmarkRepository,
} from "../interfaces/repository/bookmark";

export class DrizzleBookmarkRepository implements IBookmarkRepository {
	private readonly db: DrizzleD1Database;

	constructor(db: D1Database) {
		this.db = drizzle(db);
	}

	// お気に入りフラグを含むブックマーク情報を取得するヘルパーメソッド
	private async attachFavoriteStatus(
		where?: SQL<unknown>,
	): Promise<BookmarkWithFavorite[]> {
		const query = this.db
			.select({
				bookmark: bookmarks,
				favorite: favorites,
			})
			.from(bookmarks)
			.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId));

		const results = await (where ? query.where(where) : query).all();
		const bookmarkMap = new Map<number, BookmarkWithFavorite>();

		for (const row of results) {
			const bookmark = row.bookmark;
			const isFavorite = !!row.favorite;
			const existing = bookmarkMap.get(bookmark.id);

			if (!existing) {
				bookmarkMap.set(bookmark.id, {
					...bookmark,
					isFavorite,
				});
				continue;
			}

			bookmarkMap.set(bookmark.id, {
				...existing,
				isFavorite: existing.isFavorite || isFavorite,
			});
		}

		return Array.from(bookmarkMap.values());
	}

	async findByUrls(urls: string[]): Promise<BookmarkWithFavorite[]> {
		try {
			if (urls.length === 0) {
				return [];
			}
			return this.attachFavoriteStatus(inArray(bookmarks.url, urls));
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

	async countTodayRead(): Promise<number> {
		try {
			const nowMillis = Date.now(); // 現在のUTC時刻 (ミリ秒)
			const jstOffsetMillis = CONFIG.time.jstOffsetHours * 60 * 60 * 1000; // JST時差 (ミリ秒)
			const millisPerDay = 24 * 60 * 60 * 1000; // 1日 (ミリ秒)

			// 現在時刻にJSTオフセットを加算し、その日付のJSTでの始まりの時刻を計算
			// 結果はUTCミリ秒タイムスタンプ
			const startOfTodayJstInMillis =
				Math.floor((nowMillis + jstOffsetMillis) / millisPerDay) *
					millisPerDay -
				jstOffsetMillis;

			// ミリ秒からDateオブジェクトを作成（DrizzleはDate型を期待）
			const startOfTodayJst = new Date(startOfTodayJstInMillis);

			const result = await this.db
				.select({ count: count() })
				.from(bookmarks)
				.where(
					and(
						eq(bookmarks.isRead, true),
						// updatedAt (Date型) との比較
						gte(bookmarks.updatedAt, startOfTodayJst),
					),
				)
				.get();

			return result?.count || 0;
		} catch (error) {
			console.error("Failed to count today's read bookmarks:", error);
			throw error;
		}
	}

	async findUnread(): Promise<BookmarkWithFavorite[]> {
		try {
			const bookmarksResult = await this.db
				.select({
					bookmark: bookmarks,
					favorite: favorites,
				})
				.from(bookmarks)
				.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
				.where(eq(bookmarks.isRead, false))
				.orderBy(desc(bookmarks.createdAt))
				.all();

			return bookmarksResult.map(
				(row): BookmarkWithFavorite => ({
					...row.bookmark,
					isFavorite: !!row.favorite,
				}),
			);
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

	async markAsUnread(id: number): Promise<boolean> {
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
					isRead: false,
					updatedAt: new Date(),
				})
				.where(eq(bookmarks.id, id))
				.run();

			return true;
		} catch (error) {
			console.error("Failed to mark bookmark as unread:", error);
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
				throw new NotFoundError("ブックマークが見つかりません");
			}

			// 既にお気に入りに追加されているか確認
			const existing = await this.db
				.select()
				.from(favorites)
				.where(eq(favorites.bookmarkId, bookmarkId))
				.get();

			if (existing) {
				throw new ConflictError("すでにお気に入りに登録されています");
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
				throw new NotFoundError("お気に入りが見つかりません");
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
			const total = await this.db
				.select({ count: count() })
				.from(favorites)
				.get()
				.then((result) => result?.count || 0);

			const results = await this.attachFavoriteStatus(
				inArray(
					bookmarks.id,
					this.db.select({ id: favorites.bookmarkId }).from(favorites),
				),
			);

			return {
				bookmarks: results.slice(offset, offset + limit),
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

	async findRecentlyRead(): Promise<BookmarkWithFavorite[]> {
		try {
			const daysAgo = new Date();
			daysAgo.setDate(daysAgo.getDate() - CONFIG.time.recentArticlesDays);
			// UTC+JST時差の考慮
			daysAgo.setHours(daysAgo.getHours() - CONFIG.time.jstOffsetHours);

			const results = await this.db
				.select({
					bookmark: bookmarks,
					favorite: favorites,
				})
				.from(bookmarks)
				.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
				.where(
					and(eq(bookmarks.isRead, true), gte(bookmarks.updatedAt, daysAgo)),
				)
				.orderBy(desc(bookmarks.updatedAt))
				.all();

			return results.map((row) => ({
				...row.bookmark,
				isFavorite: !!row.favorite,
			}));
		} catch (error) {
			console.error("Failed to fetch recently read bookmarks:", error);
			throw error;
		}
	}

	async findById(id: number): Promise<BookmarkWithFavorite | undefined> {
		try {
			const results = await this.attachFavoriteStatus(eq(bookmarks.id, id));

			// 結果が空の場合はundefinedを返す
			if (results.length === 0) {
				return undefined;
			}

			// 最初の結果を返す
			return results[0];
		} catch (error) {
			console.error(
				`[ERROR] BookmarkRepository.findById: Failed to fetch bookmark by id ${id}:`,
				error,
			);
			throw error;
		}
	}

	async findByIds(ids: number[]): Promise<Map<number, BookmarkWithFavorite>> {
		try {
			const results = await this.attachFavoriteStatus(
				inArray(bookmarks.id, ids),
			);

			const bookmarkMap = new Map<number, BookmarkWithFavorite>();
			for (const bookmark of results) {
				bookmarkMap.set(bookmark.id, bookmark);
			}

			return bookmarkMap;
		} catch (error) {
			console.error(
				"[ERROR] BookmarkRepository.findByIds: Failed to fetch bookmarks by ids:",
				error,
			);
			throw error;
		}
	}
}
