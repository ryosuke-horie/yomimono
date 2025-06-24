import {
	and,
	desc,
	eq,
	type InferInsertModel,
	inArray,
	sql,
} from "drizzle-orm";
import type { Database } from "../config/database";
import {
	articleLabels,
	bookmarks,
	favorites,
	type Label,
	labels,
	type SelectBookmark,
} from "../db/schema";
import type { BookmarkWithLabel } from "../types/api";

export type InsertBookmark = InferInsertModel<typeof bookmarks>;

export class DrizzleBookmarkRepository {
	constructor(private db: Database) {}

	async findAll(): Promise<SelectBookmark[]> {
		return await this.db.select().from(bookmarks).all();
	}

	async findById(id: number): Promise<SelectBookmark | undefined> {
		const [result] = await this.db
			.select()
			.from(bookmarks)
			.where(eq(bookmarks.id, id))
			.all();
		return result;
	}

	async findByUrl(url: string): Promise<SelectBookmark | undefined> {
		const [result] = await this.db
			.select()
			.from(bookmarks)
			.where(eq(bookmarks.url, url))
			.all();
		return result;
	}

	async findByUrls(urls: string[]): Promise<SelectBookmark[]> {
		if (urls.length === 0) return [];
		return await this.db
			.select()
			.from(bookmarks)
			.where(inArray(bookmarks.url, urls))
			.all();
	}

	async findRecentlyRead(): Promise<{ [date: string]: BookmarkWithLabel[] }> {
		try {
			// 1. 最近読んだブックマーク（過去7日間）を取得
			const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			const recentlyReadResult = await this.db
				.select({
					bookmark: bookmarks,
					favorite: favorites,
				})
				.from(bookmarks)
				.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
				.where(
					and(
						eq(bookmarks.isRead, true),
						sql`${bookmarks.updatedAt} >= ${sevenDaysAgo.toISOString()}`,
					),
				)
				.orderBy(desc(bookmarks.updatedAt))
				.all();

			if (recentlyReadResult.length === 0) {
				return {};
			}

			// 2. ブックマークIDに対応するラベルを取得
			const bookmarkIds = recentlyReadResult.map((r) => r.bookmark.id);
			const labelsResult = await this.db
				.select({
					articleId: articleLabels.articleId,
					label: labels,
				})
				.from(articleLabels)
				.innerJoin(labels, eq(articleLabels.labelId, labels.id))
				.where(inArray(articleLabels.articleId, bookmarkIds))
				.all();

			// 3. ラベルをブックマークにマッピング（重複排除）
			const labelMap = new Map<number, Label>();
			for (const row of labelsResult) {
				if (!labelMap.has(row.articleId)) {
					labelMap.set(row.articleId, row.label);
				}
			}

			// 4. BookmarkWithLabelにマッピング
			const bookmarksWithLabel: BookmarkWithLabel[] = recentlyReadResult.map(
				(row): BookmarkWithLabel => ({
					...row.bookmark,
					isFavorite: !!row.favorite,
					label: labelMap.get(row.bookmark.id) || null,
				}),
			);

			// 5. 日付別にグループ化
			const groupedByDate: { [date: string]: BookmarkWithLabel[] } = {};
			for (const bookmark of bookmarksWithLabel) {
				const dateKey = bookmark.updatedAt.substring(0, 10); // YYYY-MM-DD形式
				if (!groupedByDate[dateKey]) {
					groupedByDate[dateKey] = [];
				}
				groupedByDate[dateKey].push(bookmark);
			}

			return groupedByDate;
		} catch (error) {
			console.error("Failed to fetch recently read bookmarks:", error);
			throw error;
		}
	}

	/**
	 * ブックマークを検索し未読かつJST朝9時から翌朝8:59まで（一日）に既読にした記事の件数を取得する
	 */
	async findTodayReadCount(): Promise<number> {
		const CONFIG = {
			time: {
				jstOffsetHours: 9,
				startHourJst: 9,
				endHourJst: 8,
			},
		};

		const nowMillis = Date.now();
		const jstOffsetMillis = CONFIG.time.jstOffsetHours * 60 * 60 * 1000;
		const millisPerHour = 60 * 60 * 1000;
		const millisPerDay = 24 * millisPerHour;

		// 今日の朝9時（JST）をミリ秒で計算
		const nowJstMillis = nowMillis + jstOffsetMillis;
		const daysSinceEpoch = Math.floor(nowJstMillis / millisPerDay);
		const todayStartJstMillis = daysSinceEpoch * millisPerDay;
		const todayStartUtcMillis = todayStartJstMillis - jstOffsetMillis;

		// JST朝9時に調整
		const adjustedStartUtcMillis =
			todayStartUtcMillis + CONFIG.time.startHourJst * millisPerHour;

		// 明日の朝8:59まで（翌日の朝8時59分59秒まで）
		const tomorrowEndUtcMillis =
			adjustedStartUtcMillis +
			millisPerDay +
			CONFIG.time.endHourJst * millisPerHour +
			59 * 60 * 1000 +
			59 * 1000;

		const startIso = new Date(adjustedStartUtcMillis).toISOString();
		const endIso = new Date(tomorrowEndUtcMillis).toISOString();

		const [result] = await this.db
			.select({
				count: sql<number>`count(*)`,
			})
			.from(bookmarks)
			.where(
				and(
					eq(bookmarks.isRead, true),
					sql`${bookmarks.updatedAt} >= ${startIso}`,
					sql`${bookmarks.updatedAt} <= ${endIso}`,
				),
			)
			.all();

		return result?.count || 0;
	}

	async findUnread(): Promise<BookmarkWithLabel[]> {
		try {
			// 1. 未読ブックマークを取得（重複なし）
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

			if (bookmarksResult.length === 0) {
				return [];
			}

			// 2. ブックマークIDに対応するラベルを取得（最初のラベルのみ）
			const bookmarkIds = bookmarksResult.map((r) => r.bookmark.id);

			// D1の制限を回避するためバッチ処理（最大50件ずつ）
			const labelsResult = [];
			const BATCH_SIZE = 50;
			for (let i = 0; i < bookmarkIds.length; i += BATCH_SIZE) {
				const batchIds = bookmarkIds.slice(i, i + BATCH_SIZE);
				const batchResult = await this.db
					.select({
						articleId: articleLabels.articleId,
						label: labels,
					})
					.from(articleLabels)
					.innerJoin(labels, eq(articleLabels.labelId, labels.id))
					.where(inArray(articleLabels.articleId, batchIds))
					.all();
				labelsResult.push(...batchResult);
			}

			// 3. ラベルをブックマークにマッピング（重複排除）
			const labelMap = new Map<number, Label>();
			for (const row of labelsResult) {
				if (!labelMap.has(row.articleId)) {
					labelMap.set(row.articleId, row.label);
				}
			}

			// 4. 結果をマッピング（ソート順序を維持）
			return bookmarksResult.map(
				(row): BookmarkWithLabel => ({
					...row.bookmark,
					isFavorite: !!row.favorite,
					label: labelMap.get(row.bookmark.id) || null,
				}),
			);
		} catch (error) {
			console.error("Failed to fetch unread bookmarks:", error);
			throw error;
		}
	}

	async createMany(newBookmarks: InsertBookmark[]): Promise<void> {
		if (newBookmarks.length === 0) {
			return;
		}

		await this.db.insert(bookmarks).values(newBookmarks).run();
	}

	async markAsRead(id: number): Promise<void> {
		await this.db
			.update(bookmarks)
			.set({ isRead: true, updatedAt: new Date().toISOString() })
			.where(eq(bookmarks.id, id))
			.run();
	}

	async markAsUnread(id: number): Promise<void> {
		await this.db
			.update(bookmarks)
			.set({ isRead: false, updatedAt: new Date().toISOString() })
			.where(eq(bookmarks.id, id))
			.run();
	}

	async getUnreadCount(): Promise<number> {
		const [result] = await this.db
			.select({
				count: sql<number>`count(*)`,
			})
			.from(bookmarks)
			.where(eq(bookmarks.isRead, false))
			.all();

		return result?.count || 0;
	}

	/**
	 * 特定のラベルが設定された未読ブックマークを取得
	 */
	async findUnreadByLabel(labelName: string): Promise<BookmarkWithLabel[]> {
		try {
			// 1. 指定されたラベル名のラベルIDを取得
			const [labelRecord] = await this.db
				.select({ labelId: labels.id })
				.from(labels)
				.where(eq(labels.name, labelName))
				.all();

			if (!labelRecord) {
				return [];
			}

			// 2. 指定されたラベルが設定された未読ブックマークを取得
			const bookmarksResult = await this.db
				.select({
					bookmark: bookmarks,
					favorite: favorites,
					label: labels,
				})
				.from(bookmarks)
				.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
				.innerJoin(articleLabels, eq(bookmarks.id, articleLabels.articleId))
				.innerJoin(labels, eq(articleLabels.labelId, labels.id))
				.where(
					and(eq(bookmarks.isRead, false), eq(labels.id, labelRecord.labelId)),
				)
				.orderBy(desc(bookmarks.createdAt))
				.all();

			// 3. 結果をマッピング
			return bookmarksResult.map(
				(row): BookmarkWithLabel => ({
					...row.bookmark,
					isFavorite: !!row.favorite,
					label: row.label,
				}),
			);
		} catch (error) {
			console.error(
				`Failed to fetch unread bookmarks for label ${labelName}:`,
				error,
			);
			throw error;
		}
	}

	/**
	 * お気に入りのブックマークを取得
	 */
	async findFavorites(): Promise<BookmarkWithLabel[]> {
		try {
			// 1. お気に入りのブックマークを取得
			const bookmarksResult = await this.db
				.select({
					bookmark: bookmarks,
					favorite: favorites,
				})
				.from(bookmarks)
				.innerJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
				.orderBy(desc(favorites.createdAt))
				.all();

			if (bookmarksResult.length === 0) {
				return [];
			}

			// 2. ブックマークIDに対応するラベルを取得
			const bookmarkIds = bookmarksResult.map((r) => r.bookmark.id);
			const labelsResult = await this.db
				.select({
					articleId: articleLabels.articleId,
					label: labels,
				})
				.from(articleLabels)
				.innerJoin(labels, eq(articleLabels.labelId, labels.id))
				.where(inArray(articleLabels.articleId, bookmarkIds))
				.all();

			// 3. ラベルをブックマークにマッピング（重複排除）
			const labelMap = new Map<number, Label>();
			for (const row of labelsResult) {
				if (!labelMap.has(row.articleId)) {
					labelMap.set(row.articleId, row.label);
				}
			}

			// 4. 結果をマッピング
			return bookmarksResult.map(
				(row): BookmarkWithLabel => ({
					...row.bookmark,
					isFavorite: true, // お気に入りなので必ずtrue
					label: labelMap.get(row.bookmark.id) || null,
				}),
			);
		} catch (error) {
			console.error("Failed to fetch favorite bookmarks:", error);
			throw error;
		}
	}
}
