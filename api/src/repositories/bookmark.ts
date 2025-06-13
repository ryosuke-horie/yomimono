import {
	type SQL,
	and,
	count,
	desc,
	eq,
	gte,
	inArray,
	isNull,
} from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { drizzle } from "drizzle-orm/d1";
import { CONFIG } from "../config";
import {
	type Bookmark,
	type InsertBookmark,
	articleLabels,
	bookmarks,
	favorites,
	labels,
} from "../db/schema";
import { ConflictError, NotFoundError } from "../exceptions";
import type {
	BookmarkWithLabel,
	IBookmarkRepository,
} from "../interfaces/repository/bookmark";

export class DrizzleBookmarkRepository implements IBookmarkRepository {
	private readonly db: DrizzleD1Database;

	constructor(db: D1Database) {
		this.db = drizzle(db);
	}

	// お気に入りフラグとラベル情報を含むブックマーク情報を取得するヘルパーメソッド
	private async attachLabelAndFavoriteStatus(
		where?: SQL<unknown>,
	): Promise<BookmarkWithLabel[]> {
		const query = this.db
			.select({
				bookmark: bookmarks,
				favorite: favorites,
				label: labels,
			})
			.from(bookmarks)
			.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
			.leftJoin(articleLabels, eq(bookmarks.id, articleLabels.articleId))
			.leftJoin(labels, eq(articleLabels.labelId, labels.id));

		const results = await (where ? query.where(where) : query).all();

		return results.map((row): BookmarkWithLabel => {
			const bookmark = row.bookmark;
			return {
				...bookmark,
				isFavorite: !!row.favorite,
				label: row.label || null,
			};
		});
	}

	async findByUrls(urls: string[]): Promise<BookmarkWithLabel[]> {
		try {
			if (urls.length === 0) {
				return [];
			}
			return this.attachLabelAndFavoriteStatus(inArray(bookmarks.url, urls));
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

	async findUnread(): Promise<BookmarkWithLabel[]> {
		try {
			return this.attachLabelAndFavoriteStatus(eq(bookmarks.isRead, false));
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
				throw new NotFoundError("Bookmark not found");
			}

			// 既にお気に入りに追加されているか確認
			const existing = await this.db
				.select()
				.from(favorites)
				.where(eq(favorites.bookmarkId, bookmarkId))
				.get();

			if (existing) {
				throw new ConflictError("Already favorited");
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
				throw new NotFoundError("Favorite not found");
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
		bookmarks: BookmarkWithLabel[];
		total: number;
	}> {
		try {
			const total = await this.db
				.select({ count: count() })
				.from(favorites)
				.get()
				.then((result) => result?.count || 0);

			const results = await this.attachLabelAndFavoriteStatus(
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

	async findRecentlyRead(): Promise<BookmarkWithLabel[]> {
		try {
			const daysAgo = new Date();
			daysAgo.setDate(daysAgo.getDate() - CONFIG.time.recentArticlesDays);
			// UTC+JST時差の考慮
			daysAgo.setHours(daysAgo.getHours() - CONFIG.time.jstOffsetHours);

			const query = this.db
				.select({
					bookmark: bookmarks,
					favorite: favorites,
					label: labels,
				})
				.from(bookmarks)
				.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
				.leftJoin(articleLabels, eq(bookmarks.id, articleLabels.articleId))
				.leftJoin(labels, eq(articleLabels.labelId, labels.id))
				.where(
					and(eq(bookmarks.isRead, true), gte(bookmarks.updatedAt, daysAgo)),
				)
				.orderBy(desc(bookmarks.updatedAt));

			const results = await query.all();

			return results.map((row): BookmarkWithLabel => {
				const bookmark = row.bookmark;
				return {
					...bookmark,
					isFavorite: !!row.favorite,
					label: row.label || null,
				};
			});
		} catch (error) {
			console.error("Failed to fetch recently read bookmarks:", error);
			throw error;
		}
	}
	/**
	 * ラベルが付与されていないブックマークを取得します。
	 * @returns 未ラベルのブックマーク配列
	 * * 既読のブックマークは除外されます。
	 */
	async findUnlabeled(): Promise<Bookmark[]> {
		try {
			const results = await this.db
				.select({ bookmarks: bookmarks })
				.from(bookmarks)
				.leftJoin(articleLabels, eq(bookmarks.id, articleLabels.articleId))
				.where(and(isNull(articleLabels.id), eq(bookmarks.isRead, false)))
				.all();
			return results.map((r) => r.bookmarks);
		} catch (error) {
			console.error(
				"ラベルが付与されていないブックマークの取得に失敗しました:",
				error,
			);
			throw error;
		}
	}

	async findRead(): Promise<BookmarkWithLabel[]> {
		try {
			const query = this.db
				.select({
					bookmark: bookmarks,
					favorite: favorites,
					label: labels,
				})
				.from(bookmarks)
				.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
				.leftJoin(articleLabels, eq(bookmarks.id, articleLabels.articleId))
				.leftJoin(labels, eq(articleLabels.labelId, labels.id))
				.where(eq(bookmarks.isRead, true))
				.orderBy(desc(bookmarks.updatedAt));

			const results = await query.all();

			return results.map((row): BookmarkWithLabel => {
				const bookmark = row.bookmark;
				return {
					...bookmark,
					isFavorite: !!row.favorite,
					label: row.label || null,
				};
			});
		} catch (error) {
			console.error("Failed to fetch read bookmarks:", error);
			throw error;
		}
	}

	async findByLabelName(labelName: string): Promise<BookmarkWithLabel[]> {
		try {
			const results = await this.db
				.select({
					bookmark: bookmarks,
					favorite: favorites,
					label: labels,
				})
				.from(bookmarks)
				.innerJoin(articleLabels, eq(bookmarks.id, articleLabels.articleId))
				.innerJoin(labels, eq(articleLabels.labelId, labels.id))
				.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
				.where(
					and(
						eq(labels.name, labelName),
						eq(bookmarks.isRead, false), // 未読記事のみを取得
					),
				)
				.all();

			return results.map((row) => ({
				...row.bookmark,
				isFavorite: !!row.favorite,
				label: row.label,
			}));
		} catch (error) {
			console.error("ラベル名によるブックマークの取得に失敗しました:", error);
			throw error;
		}
	}

	async findById(id: number): Promise<BookmarkWithLabel | undefined> {
		try {
			const results = await this.attachLabelAndFavoriteStatus(
				eq(bookmarks.id, id),
			);

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

	async findByIds(ids: number[]): Promise<Map<number, BookmarkWithLabel>> {
		try {
			const results = await this.attachLabelAndFavoriteStatus(
				inArray(bookmarks.id, ids),
			);

			const bookmarkMap = new Map<number, BookmarkWithLabel>();
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

	/**
	 * 評価が存在しないブックマークを取得します。
	 * 記事評価機能が削除されたため、全てのブックマークを返します。
	 * @returns 未評価のブックマーク配列
	 */
	async findUnrated(): Promise<BookmarkWithLabel[]> {
		try {
			const results = await this.db
				.select({
					bookmark: bookmarks,
					favorite: favorites,
					label: labels,
				})
				.from(bookmarks)
				.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
				.leftJoin(articleLabels, eq(bookmarks.id, articleLabels.articleId))
				.leftJoin(labels, eq(articleLabels.labelId, labels.id))
				.all();

			return results.map(
				(row): BookmarkWithLabel => ({
					...row.bookmark,
					isFavorite: !!row.favorite,
					label: row.label || null,
				}),
			);
		} catch (error) {
			console.error("Failed to fetch unrated bookmarks:", error);
			throw error;
		}
	}
}
