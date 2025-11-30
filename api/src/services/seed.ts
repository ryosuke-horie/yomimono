/**
 * シードデータ管理サービス
 * 開発環境でのテストデータ生成・管理機能を提供
 */
import { count, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { DatabaseConfig } from "../config/database";
import { getCurrentDatabaseConfig } from "../config/database";
import { articleLabels, bookmarks, favorites, labels } from "../db/schema";
import {
	clearDatabase,
	runSeedData,
	validateEnvironment as validateSeedEnvironment,
} from "../db/seed/seed";
import { InternalServerError } from "../exceptions";
import type {
	DatabaseStatus,
	ISeedService,
	SeedDataOptions,
	SeedDataResult,
} from "../interfaces/service/seed";

export class SeedService implements ISeedService {
	constructor(
		private readonly database: D1Database,
		private readonly resolveConfig: () => DatabaseConfig = getCurrentDatabaseConfig,
	) {}

	/**
	 * シードデータを生成・挿入する
	 */
	async generateSeedData(
		options: SeedDataOptions = {},
	): Promise<SeedDataResult> {
		const startTime = Date.now();

		try {
			// 環境チェック
			await this.validateEnvironment(options.forceRun);

			// デフォルトオプションを設定
			const seedOptions = {
				bookmarkCount: options.bookmarkCount ?? 25,
				labelCount: options.labelCount ?? 6,
				favoriteRatio: options.favoriteRatio ?? 0.3,
				forceRun: options.forceRun ?? false,
			};

			// シードデータ実行前の状態を取得
			const beforeStatus = await this.getDatabaseStatus();

			// シードデータを実行
			await runSeedData(seedOptions);

			// シードデータ実行後の状態を取得
			const afterStatus = await this.getDatabaseStatus();

			const executionTimeMs = Date.now() - startTime;

			return {
				success: true,
				message: `シードデータの生成が完了しました (${executionTimeMs}ms)`,
				generated: {
					bookmarks: afterStatus.bookmarkCount - beforeStatus.bookmarkCount,
					labels: afterStatus.labelCount - beforeStatus.labelCount,
					articleLabels:
						afterStatus.articleLabelCount - beforeStatus.articleLabelCount,
					favorites: afterStatus.favoriteCount - beforeStatus.favoriteCount,
				},
				executionTimeMs,
			};
		} catch (error) {
			const executionTimeMs = Date.now() - startTime;
			console.error("シードデータ生成中にエラーが発生しました:", error);

			return {
				success: false,
				message: `シードデータ生成に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
				generated: {
					bookmarks: 0,
					labels: 0,
					articleLabels: 0,
					favorites: 0,
				},
				executionTimeMs,
			};
		}
	}

	/**
	 * データベースの全データをクリアする
	 */
	async clearAllData(): Promise<SeedDataResult> {
		const startTime = Date.now();

		try {
			// 環境チェック
			await this.validateEnvironment(false);

			// クリア前の状態を取得
			const beforeStatus = await this.getDatabaseStatus();

			// データベースをクリア
			await clearDatabase();

			const executionTimeMs = Date.now() - startTime;

			return {
				success: true,
				message: `データベースのクリアが完了しました (${executionTimeMs}ms)`,
				generated: {
					bookmarks: -beforeStatus.bookmarkCount,
					labels: -beforeStatus.labelCount,
					articleLabels: -beforeStatus.articleLabelCount,
					favorites: -beforeStatus.favoriteCount,
				},
				executionTimeMs,
			};
		} catch (error) {
			const executionTimeMs = Date.now() - startTime;
			console.error("データベースクリア中にエラーが発生しました:", error);

			return {
				success: false,
				message: `データベースクリアに失敗しました: ${error instanceof Error ? error.message : String(error)}`,
				generated: {
					bookmarks: 0,
					labels: 0,
					articleLabels: 0,
					favorites: 0,
				},
				executionTimeMs,
			};
		}
	}

	/**
	 * データベースの現在の状態を取得する
	 */
	async getDatabaseStatus(): Promise<DatabaseStatus> {
		try {
			const db = drizzle(this.database);

			// 各テーブルのレコード数を並行取得
			const [
				bookmarkResult,
				labelResult,
				articleLabelResult,
				favoriteResult,
				unreadResult,
				readResult,
				latestBookmarkResult,
			] = await Promise.all([
				db.select({ count: count() }).from(bookmarks),
				db.select({ count: count() }).from(labels),
				db.select({ count: count() }).from(articleLabels),
				db.select({ count: count() }).from(favorites),
				db
					.select({ count: count() })
					.from(bookmarks)
					.where(eq(bookmarks.isRead, false)),
				db
					.select({ count: count() })
					.from(bookmarks)
					.where(eq(bookmarks.isRead, true)),
				db
					.select({ updatedAt: bookmarks.updatedAt })
					.from(bookmarks)
					.orderBy(desc(bookmarks.updatedAt))
					.limit(1),
			]);

			const lastUpdatedAt =
				latestBookmarkResult.length > 0 && latestBookmarkResult[0]?.updatedAt
					? latestBookmarkResult[0].updatedAt.toISOString()
					: null;

			return {
				bookmarkCount: bookmarkResult[0]?.count ?? 0,
				labelCount: labelResult[0]?.count ?? 0,
				articleLabelCount: articleLabelResult[0]?.count ?? 0,
				favoriteCount: favoriteResult[0]?.count ?? 0,
				unreadCount: unreadResult[0]?.count ?? 0,
				readCount: readResult[0]?.count ?? 0,
				lastUpdatedAt,
			};
		} catch (error) {
			console.error("データベース状態の取得中にエラーが発生しました:", error);
			throw new InternalServerError("データベース状態の取得に失敗しました");
		}
	}

	/**
	 * 環境チェックを実行する
	 */
	async validateEnvironment(forceRun = false): Promise<boolean> {
		try {
			const config = this.resolveConfig();

			if (config.environment === "production" && !forceRun) {
				throw new Error(
					"本番環境でのシードデータ操作は禁止されています。forceRun=trueで強制実行可能ですが注意してください。",
				);
			}

			// 既存の環境検証関数も呼び出し
			validateSeedEnvironment(forceRun);

			return true;
		} catch (error) {
			console.error("環境チェックでエラーが発生しました:", error);
			throw error;
		}
	}
}
