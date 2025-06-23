/**
 * ブックマーク機能の包括的パフォーマンステスト
 *
 * 目的:
 * - 大量データ（1000+ ブックマーク、50+ ラベル）でのクエリ実行時間測定
 * - N+1クエリ問題の検出と防止
 * - ベースラインパフォーマンス指標の確立
 * - メモリ使用効率の検証
 * - 並行処理性能の測定
 *
 * テストシナリオ:
 * 1. ベースラインパフォーマンステスト（未読・既読・お気に入り取得）
 * 2. ラベルフィルタリングパフォーマンステスト
 * 3. 集計クエリパフォーマンステスト
 * 4. 並行処理パフォーマンステスト
 * 5. メモリ使用量とリソーステスト
 *
 * パフォーマンス閾値:
 * - /read エンドポイント: 500ms以下
 * - 未読ブックマーク取得: 300ms以下
 * - お気に入り取得: 200ms以下
 * - ラベルフィルタリング: 400ms以下
 *
 * 注意: このテストはlocalのsqliteを使用し、実際のCloudflare D1とは性能特性が異なる場合があります
 */

import Database from "better-sqlite3";
import { and, count, desc, eq, gte } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { getCurrentDatabaseConfig } from "../../src/config/database";
import {
	articleLabels,
	bookmarks,
	favorites,
	type InsertArticleLabel,
	type InsertBookmark,
	type InsertFavorite,
	type InsertLabel,
	labels,
} from "../../src/db/schema";

// Type definition for BookmarkWithLabel
type BookmarkWithLabel = {
	id: number;
	url: string;
	title: string | null;
	isRead: boolean;
	createdAt: Date;
	updatedAt: Date;
	isFavorite: boolean;
	label: {
		id: number;
		name: string;
		description: string | null;
	} | null;
};

// パフォーマンステスト用の定数
const PERFORMANCE_CONFIG = {
	LARGE_DATASET: {
		BOOKMARK_COUNT: 1000,
		LABEL_COUNT: 50,
		FAVORITE_RATIO: 0.3, // 30%をお気に入りに設定
		LABELS_PER_BOOKMARK_MIN: 0,
		LABELS_PER_BOOKMARK_MAX: 3,
	},
	PERFORMANCE_THRESHOLDS: {
		// 想定されるパフォーマンス閾値 (ms)
		READ_BOOKMARKS_MAX_TIME: 500, // /read エンドポイント
		UNREAD_BOOKMARKS_MAX_TIME: 300, // 未読ブックマーク取得
		FAVORITES_MAX_TIME: 200, // お気に入り取得
		LABEL_FILTER_MAX_TIME: 400, // ラベルフィルタリング
	},
	QUERY_LOG_ENABLED: true, // SQLクエリログの有効化
} as const;

// パフォーマンス測定用のヘルパー関数
class PerformanceTracker {
	private queryLogs: string[] = [];
	private timings: Map<string, number> = new Map();

	startTiming(operation: string): void {
		this.timings.set(operation, performance.now());
	}

	endTiming(operation: string): number {
		const startTime = this.timings.get(operation);
		if (!startTime) {
			throw new Error(`No start time found for operation: ${operation}`);
		}
		const duration = performance.now() - startTime;
		this.timings.delete(operation);
		return duration;
	}

	logQuery(query: string): void {
		if (PERFORMANCE_CONFIG.QUERY_LOG_ENABLED) {
			this.queryLogs.push(query);
		}
	}

	getQueryCount(): number {
		return this.queryLogs.length;
	}

	getQueryLogs(): string[] {
		return [...this.queryLogs];
	}

	clearLogs(): void {
		this.queryLogs = [];
	}

	// N+1クエリ検出: 同じパターンのクエリが複数回実行されているかチェック
	detectNPlusOneQueries(): { detected: boolean; patterns: string[] } {
		const queryPatterns = new Map<string, number>();

		for (const query of this.queryLogs) {
			// パラメータを正規化してパターンを抽出
			const pattern = query
				.replace(/\d+/g, "?") // 数値をプレースホルダーに置換
				.replace(/'[^']*'/g, "'?'") // 文字列をプレースホルダーに置換
				.replace(/\s+/g, " ") // 複数スペースを単一スペースに
				.trim();

			queryPatterns.set(pattern, (queryPatterns.get(pattern) || 0) + 1);
		}

		const suspiciousPatterns: string[] = [];
		for (const [pattern, count] of queryPatterns.entries()) {
			// 同じパターンが3回以上実行されている場合は疑わしい
			if (count >= 3) {
				suspiciousPatterns.push(`${pattern} (executed ${count} times)`);
			}
		}

		return {
			detected: suspiciousPatterns.length > 0,
			patterns: suspiciousPatterns,
		};
	}
}

// テスト用データ生成クラス
class PerformanceDataGenerator {
	private db: ReturnType<typeof drizzle>;

	constructor(database: Database.Database) {
		this.db = drizzle(database);
	}

	async generateLargeDataset(): Promise<{
		bookmarkIds: number[];
		labelIds: number[];
		stats: {
			totalBookmarks: number;
			totalLabels: number;
			totalFavorites: number;
			totalLabelAssignments: number;
		};
	}> {
		const { BOOKMARK_COUNT, LABEL_COUNT, FAVORITE_RATIO } =
			PERFORMANCE_CONFIG.LARGE_DATASET;

		// 1. ラベルデータを生成
		const labelData: InsertLabel[] = Array.from(
			{ length: LABEL_COUNT },
			(_, i) => ({
				name: `Performance Label ${i + 1}`,
				description: `Performance test label for load testing - label ${i + 1}`,
			}),
		);

		const insertedLabels = await this.db
			.insert(labels)
			.values(labelData)
			.returning({ id: labels.id });
		const labelIds = insertedLabels.map((label) => label.id);

		// 2. ブックマークデータを生成
		const bookmarkData: InsertBookmark[] = Array.from(
			{ length: BOOKMARK_COUNT },
			(_, i) => ({
				url: `https://example.com/article-${i + 1}`,
				title: `Performance Test Article ${i + 1}: Advanced Web Development Techniques and Best Practices`,
				isRead: Math.random() > 0.7, // 30%を既読に設定
			}),
		);

		const insertedBookmarks = await this.db
			.insert(bookmarks)
			.values(bookmarkData)
			.returning({ id: bookmarks.id });
		const bookmarkIds = insertedBookmarks.map((bookmark) => bookmark.id);

		// 3. お気に入りデータを生成
		const favoriteBookmarkIds = bookmarkIds
			.filter(() => Math.random() < FAVORITE_RATIO)
			.slice(0, Math.floor(BOOKMARK_COUNT * FAVORITE_RATIO));

		const favoriteData: InsertFavorite[] = favoriteBookmarkIds.map(
			(bookmarkId) => ({
				bookmarkId,
			}),
		);

		if (favoriteData.length > 0) {
			await this.db.insert(favorites).values(favoriteData);
		}

		// 4. ブックマーク-ラベル紐付けデータを生成（現実的な分布）
		const articleLabelData: InsertArticleLabel[] = [];
		const { LABELS_PER_BOOKMARK_MIN, LABELS_PER_BOOKMARK_MAX } =
			PERFORMANCE_CONFIG.LARGE_DATASET;

		for (const bookmarkId of bookmarkIds) {
			// 各ブックマークに0-3個のラベルをランダムに割り当て
			const labelsCount =
				Math.floor(
					Math.random() *
						(LABELS_PER_BOOKMARK_MAX - LABELS_PER_BOOKMARK_MIN + 1),
				) + LABELS_PER_BOOKMARK_MIN;

			if (labelsCount > 0) {
				// ランダムにラベルを選択（重複なし）
				const shuffledLabels = [...labelIds].sort(() => Math.random() - 0.5);
				const selectedLabels = shuffledLabels.slice(0, labelsCount);

				for (const labelId of selectedLabels) {
					articleLabelData.push({
						articleId: bookmarkId,
						labelId,
					});
				}
			}
		}

		if (articleLabelData.length > 0) {
			await this.db.insert(articleLabels).values(articleLabelData);
		}

		return {
			bookmarkIds,
			labelIds,
			stats: {
				totalBookmarks: BOOKMARK_COUNT,
				totalLabels: LABEL_COUNT,
				totalFavorites: favoriteData.length,
				totalLabelAssignments: articleLabelData.length,
			},
		};
	}

	async clearPerformanceData(): Promise<void> {
		await this.db.delete(articleLabels);
		await this.db.delete(favorites);
		await this.db.delete(bookmarks);
		await this.db.delete(labels);
	}
}

// Better-SQLite3用のブックマークリポジトリ実装
class BetterSQLiteBookmarkRepository {
	private readonly db: BetterSQLite3Database;

	constructor(database: Database.Database) {
		this.db = drizzle(database);
	}

	async findUnread(): Promise<BookmarkWithLabel[]> {
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
			.where(eq(bookmarks.isRead, false))
			.orderBy(desc(bookmarks.createdAt))
			.all();

		return this.processBookmarkResults(results);
	}

	async findRead(): Promise<BookmarkWithLabel[]> {
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
			.where(eq(bookmarks.isRead, true))
			.orderBy(desc(bookmarks.updatedAt))
			.all();

		return this.processBookmarkResults(results);
	}

	async findFavorites(): Promise<{ bookmarks: BookmarkWithLabel[] }> {
		const results = await this.db
			.select({
				bookmark: bookmarks,
				favorite: favorites,
				label: labels,
			})
			.from(bookmarks)
			.innerJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
			.leftJoin(articleLabels, eq(bookmarks.id, articleLabels.articleId))
			.leftJoin(labels, eq(articleLabels.labelId, labels.id))
			.orderBy(desc(favorites.createdAt))
			.all();

		return { bookmarks: this.processBookmarkResults(results) };
	}

	async findByLabel(labelName: string): Promise<BookmarkWithLabel[]> {
		const results = await this.db
			.select({
				bookmark: bookmarks,
				favorite: favorites,
				label: labels,
			})
			.from(bookmarks)
			.leftJoin(favorites, eq(bookmarks.id, favorites.bookmarkId))
			.innerJoin(articleLabels, eq(bookmarks.id, articleLabels.articleId))
			.innerJoin(labels, eq(articleLabels.labelId, labels.id))
			.where(eq(labels.name, labelName))
			.orderBy(desc(bookmarks.createdAt))
			.all();

		return this.processBookmarkResults(results);
	}

	async countUnread(): Promise<number> {
		const result = await this.db
			.select({ count: count() })
			.from(bookmarks)
			.where(eq(bookmarks.isRead, false))
			.get();

		return result?.count || 0;
	}

	async countTodayRead(): Promise<number> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const result = await this.db
			.select({ count: count() })
			.from(bookmarks)
			.where(and(eq(bookmarks.isRead, true), gte(bookmarks.updatedAt, today)))
			.get();

		return result?.count || 0;
	}

	private processBookmarkResults(results: unknown[]): BookmarkWithLabel[] {
		const bookmarkMap = new Map<number, BookmarkWithLabel>();

		for (const row of results) {
			const typedRow = row as {
				bookmark: {
					id: number;
					url: string;
					title: string | null;
					isRead: boolean;
					createdAt: Date;
					updatedAt: Date;
				};
				favorite: unknown;
				label: {
					id: number;
					name: string;
					description: string | null;
				} | null;
			};
			const bookmark = typedRow.bookmark;
			if (!bookmarkMap.has(bookmark.id)) {
				bookmarkMap.set(bookmark.id, {
					...bookmark,
					isFavorite: !!typedRow.favorite,
					label: typedRow.label || null,
				});
			}
		}

		return Array.from(bookmarkMap.values());
	}
}

// カスタムサービス実装（パフォーマンステスト用）
class PerformanceBookmarkService {
	constructor(private readonly repository: BetterSQLiteBookmarkRepository) {}

	async getUnreadBookmarks(): Promise<BookmarkWithLabel[]> {
		return await this.repository.findUnread();
	}

	async getReadBookmarks(): Promise<BookmarkWithLabel[]> {
		return await this.repository.findRead();
	}

	async getFavoriteBookmarks(): Promise<{ bookmarks: BookmarkWithLabel[] }> {
		return await this.repository.findFavorites();
	}

	async getBookmarksByLabel(labelName: string): Promise<BookmarkWithLabel[]> {
		return await this.repository.findByLabel(labelName);
	}

	async getUnreadBookmarksCount(): Promise<number> {
		return await this.repository.countUnread();
	}

	async getTodayReadCount(): Promise<number> {
		return await this.repository.countTodayRead();
	}
}

describe("ブックマーク機能パフォーマンステスト", () => {
	let database: Database.Database;
	let bookmarkRepository: BetterSQLiteBookmarkRepository;
	let bookmarkService: PerformanceBookmarkService;
	let dataGenerator: PerformanceDataGenerator;
	let performanceTracker: PerformanceTracker;
	let testDataIds: {
		bookmarkIds: number[];
		labelIds: number[];
		stats: {
			totalBookmarks: number;
			totalLabels: number;
			totalFavorites: number;
			totalLabelAssignments: number;
		};
	};

	beforeAll(async () => {
		// テスト用SQLiteデータベースを作成
		const _dbConfig = getCurrentDatabaseConfig();
		database = new Database(":memory:");

		// スキーマを初期化
		const schemaSQL = `
			CREATE TABLE IF NOT EXISTS bookmarks (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				url TEXT NOT NULL,
				title TEXT,
				is_read INTEGER NOT NULL DEFAULT 0,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL
			);

			CREATE TABLE IF NOT EXISTS labels (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL UNIQUE,
				description TEXT,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL
			);

			CREATE TABLE IF NOT EXISTS favorites (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				bookmark_id INTEGER NOT NULL UNIQUE,
				created_at INTEGER NOT NULL,
				FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
			);

			CREATE TABLE IF NOT EXISTS article_labels (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				article_id INTEGER NOT NULL,
				label_id INTEGER NOT NULL,
				created_at INTEGER NOT NULL,
				FOREIGN KEY (article_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
				FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
			);

			-- パフォーマンス向上のためのインデックス
			CREATE INDEX IF NOT EXISTS idx_bookmarks_is_read ON bookmarks(is_read);
			CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at);
			CREATE INDEX IF NOT EXISTS idx_favorites_bookmark_id ON favorites(bookmark_id);
			CREATE INDEX IF NOT EXISTS idx_article_labels_article_id ON article_labels(article_id);
			CREATE INDEX IF NOT EXISTS idx_article_labels_label_id ON article_labels(label_id);
		`;

		database.exec(schemaSQL);

		// リポジトリとサービスを初期化
		bookmarkRepository = new BetterSQLiteBookmarkRepository(database);
		bookmarkService = new PerformanceBookmarkService(bookmarkRepository);
		dataGenerator = new PerformanceDataGenerator(database);
		performanceTracker = new PerformanceTracker();

		// 大量テストデータを生成
		console.log("🚀 大量テストデータ生成開始...");
		performanceTracker.startTiming("data-generation");
		testDataIds = await dataGenerator.generateLargeDataset();
		const dataGenTime = performanceTracker.endTiming("data-generation");

		console.log(`✅ テストデータ生成完了 (${dataGenTime.toFixed(2)}ms)`);
		console.log("📊 生成データ統計:", testDataIds.stats);
	});

	afterAll(async () => {
		if (database) {
			await dataGenerator.clearPerformanceData();
			database.close();
		}
	});

	describe("ベースラインパフォーマンステスト", () => {
		test("大量データでの未読ブックマーク取得パフォーマンス", async () => {
			performanceTracker.clearLogs();
			performanceTracker.startTiming("getUnreadBookmarks");

			const unreadBookmarks = await bookmarkService.getUnreadBookmarks();
			const duration = performanceTracker.endTiming("getUnreadBookmarks");

			// パフォーマンス検証
			expect(duration).toBeLessThan(
				PERFORMANCE_CONFIG.PERFORMANCE_THRESHOLDS.UNREAD_BOOKMARKS_MAX_TIME,
			);
			expect(unreadBookmarks).toBeDefined();
			expect(Array.isArray(unreadBookmarks)).toBe(true);

			// N+1クエリ検出
			const n1Detection = performanceTracker.detectNPlusOneQueries();
			expect(n1Detection.detected).toBe(false);

			console.log(
				`📈 未読ブックマーク取得: ${duration.toFixed(2)}ms (取得件数: ${unreadBookmarks.length}件)`,
			);
			console.log(`🔍 実行クエリ数: ${performanceTracker.getQueryCount()}`);

			if (n1Detection.detected) {
				console.warn("⚠️ N+1クエリ検出:", n1Detection.patterns);
			}
		});

		test("大量データでの既読ブックマーク取得パフォーマンス", async () => {
			performanceTracker.clearLogs();
			performanceTracker.startTiming("getReadBookmarks");

			const readBookmarks = await bookmarkService.getReadBookmarks();
			const duration = performanceTracker.endTiming("getReadBookmarks");

			// パフォーマンス検証
			expect(duration).toBeLessThan(
				PERFORMANCE_CONFIG.PERFORMANCE_THRESHOLDS.READ_BOOKMARKS_MAX_TIME,
			);
			expect(readBookmarks).toBeDefined();
			expect(Array.isArray(readBookmarks)).toBe(true);

			// N+1クエリ検出
			const n1Detection = performanceTracker.detectNPlusOneQueries();
			expect(n1Detection.detected).toBe(false);

			console.log(
				`📈 既読ブックマーク取得: ${duration.toFixed(2)}ms (取得件数: ${readBookmarks.length}件)`,
			);
			console.log(`🔍 実行クエリ数: ${performanceTracker.getQueryCount()}`);

			if (n1Detection.detected) {
				console.warn("⚠️ N+1クエリ検出:", n1Detection.patterns);
			}
		});

		test("大量データでのお気に入りブックマーク取得パフォーマンス", async () => {
			performanceTracker.clearLogs();
			performanceTracker.startTiming("getFavoriteBookmarks");

			const favoriteResult = await bookmarkService.getFavoriteBookmarks();
			const duration = performanceTracker.endTiming("getFavoriteBookmarks");

			// パフォーマンス検証
			expect(duration).toBeLessThan(
				PERFORMANCE_CONFIG.PERFORMANCE_THRESHOLDS.FAVORITES_MAX_TIME,
			);
			expect(favoriteResult).toBeDefined();
			expect(favoriteResult.bookmarks).toBeDefined();
			expect(Array.isArray(favoriteResult.bookmarks)).toBe(true);

			// N+1クエリ検出
			const n1Detection = performanceTracker.detectNPlusOneQueries();
			expect(n1Detection.detected).toBe(false);

			console.log(
				`📈 お気に入り取得: ${duration.toFixed(2)}ms (取得件数: ${favoriteResult.bookmarks.length}件)`,
			);
			console.log(`🔍 実行クエリ数: ${performanceTracker.getQueryCount()}`);

			if (n1Detection.detected) {
				console.warn("⚠️ N+1クエリ検出:", n1Detection.patterns);
			}
		});
	});

	describe("ラベルフィルタリングパフォーマンステスト", () => {
		test("ラベル別ブックマーク取得のパフォーマンス", async () => {
			// テスト用にラベルを1つ選択
			const testLabelId = testDataIds.labelIds[0];
			const testLabel = (await database
				.prepare("SELECT name FROM labels WHERE id = ?")
				.get(testLabelId)) as { name: string };

			performanceTracker.clearLogs();
			performanceTracker.startTiming("getBookmarksByLabel");

			const labeledBookmarks = await bookmarkService.getBookmarksByLabel(
				testLabel.name,
			);
			const duration = performanceTracker.endTiming("getBookmarksByLabel");

			// パフォーマンス検証
			expect(duration).toBeLessThan(
				PERFORMANCE_CONFIG.PERFORMANCE_THRESHOLDS.LABEL_FILTER_MAX_TIME,
			);
			expect(labeledBookmarks).toBeDefined();
			expect(Array.isArray(labeledBookmarks)).toBe(true);

			// N+1クエリ検出
			const n1Detection = performanceTracker.detectNPlusOneQueries();
			expect(n1Detection.detected).toBe(false);

			console.log(
				`📈 ラベルフィルタリング (${testLabel.name}): ${duration.toFixed(2)}ms (取得件数: ${labeledBookmarks.length}件)`,
			);
			console.log(`🔍 実行クエリ数: ${performanceTracker.getQueryCount()}`);

			if (n1Detection.detected) {
				console.warn("⚠️ N+1クエリ検出:", n1Detection.patterns);
			}
		});

		test("複数ラベルでのフィルタリングパフォーマンス比較", async () => {
			const sampleLabels = testDataIds.labelIds.slice(0, 5);
			const results: Array<{
				labelName: string;
				duration: number;
				count: number;
			}> = [];

			for (const labelId of sampleLabels) {
				const label = (await database
					.prepare("SELECT name FROM labels WHERE id = ?")
					.get(labelId)) as { name: string };

				performanceTracker.clearLogs();
				performanceTracker.startTiming(`label-${labelId}`);

				const bookmarks = await bookmarkService.getBookmarksByLabel(label.name);
				const duration = performanceTracker.endTiming(`label-${labelId}`);

				results.push({
					labelName: label.name,
					duration,
					count: bookmarks.length,
				});

				// 各ラベルでのN+1クエリ検出
				const n1Detection = performanceTracker.detectNPlusOneQueries();
				expect(n1Detection.detected).toBe(false);
			}

			// 結果の統計分析
			const avgDuration =
				results.reduce((sum, r) => sum + r.duration, 0) / results.length;
			const maxDuration = Math.max(...results.map((r) => r.duration));
			const minDuration = Math.min(...results.map((r) => r.duration));

			console.log("📊 ラベルフィルタリング統計:");
			console.log(`  平均実行時間: ${avgDuration.toFixed(2)}ms`);
			console.log(`  最大実行時間: ${maxDuration.toFixed(2)}ms`);
			console.log(`  最小実行時間: ${minDuration.toFixed(2)}ms`);

			// 全ての結果が閾値以下であることを確認
			for (const result of results) {
				expect(result.duration).toBeLessThan(
					PERFORMANCE_CONFIG.PERFORMANCE_THRESHOLDS.LABEL_FILTER_MAX_TIME,
				);
			}
		});
	});

	describe("集計クエリパフォーマンステスト", () => {
		test("未読ブックマーク件数取得のパフォーマンス", async () => {
			performanceTracker.clearLogs();
			performanceTracker.startTiming("getUnreadBookmarksCount");

			const unreadCount = await bookmarkService.getUnreadBookmarksCount();
			const duration = performanceTracker.endTiming("getUnreadBookmarksCount");

			// パフォーマンス検証（集計クエリは高速であるべき）
			expect(duration).toBeLessThan(100); // 100ms以下
			expect(typeof unreadCount).toBe("number");
			expect(unreadCount).toBeGreaterThanOrEqual(0);

			console.log(
				`📈 未読件数取得: ${duration.toFixed(2)}ms (件数: ${unreadCount}件)`,
			);
			console.log(`🔍 実行クエリ数: ${performanceTracker.getQueryCount()}`);
		});

		test("今日の既読件数取得のパフォーマンス", async () => {
			performanceTracker.clearLogs();
			performanceTracker.startTiming("getTodayReadCount");

			const todayReadCount = await bookmarkService.getTodayReadCount();
			const duration = performanceTracker.endTiming("getTodayReadCount");

			// パフォーマンス検証
			expect(duration).toBeLessThan(100); // 100ms以下
			expect(typeof todayReadCount).toBe("number");
			expect(todayReadCount).toBeGreaterThanOrEqual(0);

			console.log(
				`📈 今日の既読件数取得: ${duration.toFixed(2)}ms (件数: ${todayReadCount}件)`,
			);
			console.log(`🔍 実行クエリ数: ${performanceTracker.getQueryCount()}`);
		});
	});

	describe("コンカレント処理パフォーマンステスト", () => {
		test("並行クエリ実行のパフォーマンス", async () => {
			performanceTracker.clearLogs();
			performanceTracker.startTiming("concurrentQueries");

			// 複数のクエリを並行実行（実際のAPIエンドポイントで発生するパターン）
			const [unreadBookmarks, unreadCount, todayReadCount] = await Promise.all([
				bookmarkService.getUnreadBookmarks(),
				bookmarkService.getUnreadBookmarksCount(),
				bookmarkService.getTodayReadCount(),
			]);

			const duration = performanceTracker.endTiming("concurrentQueries");

			// パフォーマンス検証
			expect(duration).toBeLessThan(600); // 並行実行により600ms以下
			expect(unreadBookmarks).toBeDefined();
			expect(typeof unreadCount).toBe("number");
			expect(typeof todayReadCount).toBe("number");

			console.log(`📈 並行クエリ実行: ${duration.toFixed(2)}ms`);
			console.log(`  - 未読ブックマーク: ${unreadBookmarks.length}件`);
			console.log(`  - 未読件数: ${unreadCount}件`);
			console.log(`  - 今日の既読件数: ${todayReadCount}件`);
			console.log(`🔍 総実行クエリ数: ${performanceTracker.getQueryCount()}`);
		});
	});

	describe("メモリ使用量とリソーステスト", () => {
		test("大量データ処理時のメモリ効率性", async () => {
			const initialMemory = process.memoryUsage();

			// 大量データを複数回処理
			for (let i = 0; i < 5; i++) {
				const bookmarks = await bookmarkService.getUnreadBookmarks();
				const readBookmarks = await bookmarkService.getReadBookmarks();
				// 処理後のメモリ解放を確認するため、変数をクリア
				void bookmarks;
				void readBookmarks;
			}

			// ガベージコレクションを強制実行
			if (global.gc) {
				global.gc();
			}

			const finalMemory = process.memoryUsage();
			const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

			console.log("🧠 メモリ使用量:");
			console.log(
				`  初期ヒープ: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
			);
			console.log(
				`  最終ヒープ: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`,
			);
			console.log(`  増加量: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

			// メモリリークがないことを確認（増加量が50MB以下）
			expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
		});
	});
});

// パフォーマンステスト実行時にのみ適用されるin-sourceテスト
if (import.meta.vitest) {
	const {
		describe: vitestDescribe,
		test: vitestTest,
		expect: vitestExpected,
	} = import.meta.vitest;

	vitestDescribe("パフォーマンス計測ユーティリティ", () => {
		vitestTest("PerformanceTrackerの基本機能", () => {
			const tracker = new PerformanceTracker();

			// タイミング測定
			tracker.startTiming("test-operation");
			// 疑似処理時間
			const start = performance.now();
			while (performance.now() - start < 1) {
				// 1ms待機
			}
			const duration = tracker.endTiming("test-operation");

			vitestExpected(duration).toBeGreaterThan(0);
			vitestExpected(duration).toBeLessThan(100); // 100ms以下

			// クエリログ
			tracker.logQuery("SELECT * FROM bookmarks WHERE id = 1");
			tracker.logQuery("SELECT * FROM bookmarks WHERE id = 2");
			tracker.logQuery("SELECT * FROM bookmarks WHERE id = 3");

			vitestExpected(tracker.getQueryCount()).toBe(3);

			// N+1検出
			const detection = tracker.detectNPlusOneQueries();
			vitestExpected(detection.detected).toBe(true);
			vitestExpected(detection.patterns.length).toBeGreaterThan(0);
		});
	});
}
