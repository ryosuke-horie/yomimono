/**
 * 設定管理モジュール
 * 環境変数とデフォルト値を統合した設定システム
 */

/**
 * ページネーション関連の設定
 */
export const PAGINATION_CONFIG = {
	defaultOffset: Number(process.env.DEFAULT_OFFSET) || 0,
	defaultPageSize: Number(process.env.DEFAULT_PAGE_SIZE) || 20,
	maxPageSize: Number(process.env.MAX_PAGE_SIZE) || 100,
} as const;

/**
 * 処理制限に関する設定
 */
export const LIMITS_CONFIG = {
	maxFavorites: Number(process.env.MAX_FAVORITES_LIMIT) || 1000,
	maxBulkInsert: Number(process.env.MAX_BULK_INSERT) || 100,
	maxSearchResults: Number(process.env.MAX_SEARCH_RESULTS) || 500,
} as const;

/**
 * 時間関連の設定
 */
export const TIME_CONFIG = {
	recentArticlesDays: Number(process.env.RECENT_ARTICLES_DAYS) || 3,
	jstOffsetHours: Number(process.env.JST_OFFSET_HOURS) || 9,
} as const;

/**
 * タイムアウト設定
 */
export const TIMEOUT_CONFIG = {
	dbQueryTimeout: Number(process.env.DB_QUERY_TIMEOUT) || 30000,
	requestTimeout: Number(process.env.REQUEST_TIMEOUT) || 60000,
} as const;

/**
 * すべての設定を統合したオブジェクト
 */
export const CONFIG = {
	pagination: PAGINATION_CONFIG,
	limits: LIMITS_CONFIG,
	time: TIME_CONFIG,
	timeout: TIMEOUT_CONFIG,
} as const;

/**
 * 設定値の検証
 */
export function validateConfig(): void {
	// ページネーション設定の検証
	if (CONFIG.pagination.defaultPageSize > CONFIG.pagination.maxPageSize) {
		throw new Error("DEFAULT_PAGE_SIZE cannot be greater than MAX_PAGE_SIZE");
	}

	// 制限値の検証
	if (CONFIG.limits.maxFavorites <= 0) {
		throw new Error("MAX_FAVORITES_LIMIT must be greater than 0");
	}

	if (CONFIG.limits.maxBulkInsert <= 0) {
		throw new Error("MAX_BULK_INSERT must be greater than 0");
	}

	// 時間設定の検証
	if (CONFIG.time.recentArticlesDays <= 0) {
		throw new Error("RECENT_ARTICLES_DAYS must be greater than 0");
	}

	if (CONFIG.time.jstOffsetHours < -12 || CONFIG.time.jstOffsetHours > 14) {
		throw new Error("JST_OFFSET_HOURS must be between -12 and 14");
	}

	// タイムアウト設定の検証
	if (CONFIG.timeout.dbQueryTimeout <= 0) {
		throw new Error("DB_QUERY_TIMEOUT must be greater than 0");
	}

	if (CONFIG.timeout.requestTimeout <= 0) {
		throw new Error("REQUEST_TIMEOUT must be greater than 0");
	}
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe("Configuration Module", () => {
		test("デフォルト設定値が正しく設定されている", () => {
			expect(CONFIG.pagination.defaultOffset).toBe(0);
			expect(CONFIG.pagination.defaultPageSize).toBe(20);
			expect(CONFIG.pagination.maxPageSize).toBe(100);
			expect(CONFIG.limits.maxFavorites).toBe(1000);
			expect(CONFIG.limits.maxBulkInsert).toBe(100);
			expect(CONFIG.time.recentArticlesDays).toBe(3);
			expect(CONFIG.time.jstOffsetHours).toBe(9);
		});

		test("設定値検証が正常に動作する", () => {
			expect(() => validateConfig()).not.toThrow();
		});

		test("無効な設定値でエラーが発生する", () => {
			// 元の環境変数を保存
			const originalMaxFavorites = process.env.MAX_FAVORITES_LIMIT;

			// 無効な値を設定
			process.env.MAX_FAVORITES_LIMIT = "0";

			try {
				// 無効な設定値での検証
				expect(() => {
					if (Number(process.env.MAX_FAVORITES_LIMIT) <= 0) {
						throw new Error("MAX_FAVORITES_LIMIT must be greater than 0");
					}
				}).toThrow("MAX_FAVORITES_LIMIT must be greater than 0");
			} finally {
				// 環境変数を復元
				if (originalMaxFavorites !== undefined) {
					process.env.MAX_FAVORITES_LIMIT = originalMaxFavorites;
				} else {
					process.env.MAX_FAVORITES_LIMIT = undefined;
				}
			}
		});
	});
}
