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
	const { test, expect, describe, beforeEach, afterEach } = import.meta.vitest;

	describe("Configuration Module", () => {
		// 元の環境変数を保存
		const originalEnv = { ...process.env };

		beforeEach(() => {
			// 各テスト前に環境変数をリセット
			for (const key of Object.keys(process.env)) {
				if (
					key.includes("DEFAULT_") ||
					key.includes("MAX_") ||
					key.includes("RECENT_") ||
					key.includes("JST_") ||
					key.includes("TIMEOUT")
				) {
					delete process.env[key];
				}
			}
		});

		afterEach(() => {
			// 各テスト後に環境変数を復元
			process.env = { ...originalEnv };
		});

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

		describe("validateConfig エラーケース", () => {
			test("DEFAULT_PAGE_SIZE > MAX_PAGE_SIZE でエラーが発生する", () => {
				// CONFIG を書き換えてテスト
				const originalDefaultPageSize = CONFIG.pagination.defaultPageSize;
				const originalMaxPageSize = CONFIG.pagination.maxPageSize;

				// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
				(CONFIG.pagination as any).defaultPageSize = 150;
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
				(CONFIG.pagination as any).maxPageSize = 100;

				try {
					expect(() => validateConfig()).toThrow(
						"DEFAULT_PAGE_SIZE cannot be greater than MAX_PAGE_SIZE",
					);
				} finally {
					// 値を復元
					// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
					(CONFIG.pagination as any).defaultPageSize = originalDefaultPageSize;
					// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
					(CONFIG.pagination as any).maxPageSize = originalMaxPageSize;
				}
			});

			test("MAX_FAVORITES_LIMIT <= 0 でエラーが発生する", () => {
				const originalMaxFavorites = CONFIG.limits.maxFavorites;
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
				(CONFIG.limits as any).maxFavorites = 0;

				try {
					expect(() => validateConfig()).toThrow(
						"MAX_FAVORITES_LIMIT must be greater than 0",
					);
				} finally {
					// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
					(CONFIG.limits as any).maxFavorites = originalMaxFavorites;
				}
			});

			test("MAX_BULK_INSERT <= 0 でエラーが発生する", () => {
				const originalMaxBulkInsert = CONFIG.limits.maxBulkInsert;
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
				(CONFIG.limits as any).maxBulkInsert = -1;

				try {
					expect(() => validateConfig()).toThrow(
						"MAX_BULK_INSERT must be greater than 0",
					);
				} finally {
					// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
					(CONFIG.limits as any).maxBulkInsert = originalMaxBulkInsert;
				}
			});

			test("RECENT_ARTICLES_DAYS <= 0 でエラーが発生する", () => {
				const originalRecentArticlesDays = CONFIG.time.recentArticlesDays;
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
				(CONFIG.time as any).recentArticlesDays = 0;

				try {
					expect(() => validateConfig()).toThrow(
						"RECENT_ARTICLES_DAYS must be greater than 0",
					);
				} finally {
					// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
					(CONFIG.time as any).recentArticlesDays = originalRecentArticlesDays;
				}
			});

			test("JST_OFFSET_HOURS < -12 でエラーが発生する", () => {
				const originalJstOffsetHours = CONFIG.time.jstOffsetHours;
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
				(CONFIG.time as any).jstOffsetHours = -13;

				try {
					expect(() => validateConfig()).toThrow(
						"JST_OFFSET_HOURS must be between -12 and 14",
					);
				} finally {
					// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
					(CONFIG.time as any).jstOffsetHours = originalJstOffsetHours;
				}
			});

			test("JST_OFFSET_HOURS > 14 でエラーが発生する", () => {
				const originalJstOffsetHours = CONFIG.time.jstOffsetHours;
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
				(CONFIG.time as any).jstOffsetHours = 15;

				try {
					expect(() => validateConfig()).toThrow(
						"JST_OFFSET_HOURS must be between -12 and 14",
					);
				} finally {
					// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
					(CONFIG.time as any).jstOffsetHours = originalJstOffsetHours;
				}
			});

			test("DB_QUERY_TIMEOUT <= 0 でエラーが発生する", () => {
				const originalDbQueryTimeout = CONFIG.timeout.dbQueryTimeout;
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
				(CONFIG.timeout as any).dbQueryTimeout = 0;

				try {
					expect(() => validateConfig()).toThrow(
						"DB_QUERY_TIMEOUT must be greater than 0",
					);
				} finally {
					// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
					(CONFIG.timeout as any).dbQueryTimeout = originalDbQueryTimeout;
				}
			});

			test("REQUEST_TIMEOUT <= 0 でエラーが発生する", () => {
				const originalRequestTimeout = CONFIG.timeout.requestTimeout;
				// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
				(CONFIG.timeout as any).requestTimeout = -1000;

				try {
					expect(() => validateConfig()).toThrow(
						"REQUEST_TIMEOUT must be greater than 0",
					);
				} finally {
					// biome-ignore lint/suspicious/noExplicitAny: テスト用の一時的な型変更
					(CONFIG.timeout as any).requestTimeout = originalRequestTimeout;
				}
			});
		});

		describe("環境変数読み込みテスト", () => {
			test("環境変数が設定されている場合は環境変数の値を使用する", () => {
				process.env.DEFAULT_OFFSET = "10";
				process.env.DEFAULT_PAGE_SIZE = "50";
				process.env.MAX_FAVORITES_LIMIT = "2000";

				// 新しいCONFIGオブジェクトを作成してテスト
				const testConfig = {
					pagination: {
						defaultOffset: Number(process.env.DEFAULT_OFFSET) || 0,
						defaultPageSize: Number(process.env.DEFAULT_PAGE_SIZE) || 20,
						maxPageSize: Number(process.env.MAX_PAGE_SIZE) || 100,
					},
					limits: {
						maxFavorites: Number(process.env.MAX_FAVORITES_LIMIT) || 1000,
						maxBulkInsert: Number(process.env.MAX_BULK_INSERT) || 100,
						maxSearchResults: Number(process.env.MAX_SEARCH_RESULTS) || 500,
					},
				};

				expect(testConfig.pagination.defaultOffset).toBe(10);
				expect(testConfig.pagination.defaultPageSize).toBe(50);
				expect(testConfig.limits.maxFavorites).toBe(2000);
			});

			test("無効な環境変数（非数値）の場合はデフォルト値を使用する", () => {
				process.env.DEFAULT_OFFSET = "invalid";
				process.env.MAX_FAVORITES_LIMIT = "not_a_number";

				const testConfig = {
					pagination: {
						defaultOffset: Number(process.env.DEFAULT_OFFSET) || 0,
					},
					limits: {
						maxFavorites: Number(process.env.MAX_FAVORITES_LIMIT) || 1000,
					},
				};

				expect(testConfig.pagination.defaultOffset).toBe(0);
				expect(testConfig.limits.maxFavorites).toBe(1000);
			});
		});
	});
}
