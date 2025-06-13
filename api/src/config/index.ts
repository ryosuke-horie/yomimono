/**
 * 設定管理モジュール
 * 環境変数とデフォルト値を統合した設定システム
 */

/**
 * 環境変数インターフェース
 */
export interface ConfigEnv {
	DEFAULT_OFFSET?: string;
	DEFAULT_PAGE_SIZE?: string;
	MAX_PAGE_SIZE?: string;
	MAX_FAVORITES_LIMIT?: string;
	MAX_BULK_INSERT?: string;
	MAX_SEARCH_RESULTS?: string;
	RECENT_ARTICLES_DAYS?: string;
	JST_OFFSET_HOURS?: string;
	DB_QUERY_TIMEOUT?: string;
	REQUEST_TIMEOUT?: string;
}

/**
 * 設定値の型定義
 */
export interface Config {
	pagination: {
		defaultOffset: number;
		defaultPageSize: number;
		maxPageSize: number;
	};
	limits: {
		maxFavorites: number;
		maxBulkInsert: number;
		maxSearchResults: number;
	};
	time: {
		recentArticlesDays: number;
		jstOffsetHours: number;
	};
	timeout: {
		dbQueryTimeout: number;
		requestTimeout: number;
	};
}

/**
 * 環境変数から設定オブジェクトを作成する関数
 */
export function createConfig(env: ConfigEnv = {}): Config {
	return {
		pagination: {
			defaultOffset: Number(env.DEFAULT_OFFSET) || 0,
			defaultPageSize: Number(env.DEFAULT_PAGE_SIZE) || 20,
			maxPageSize: Number(env.MAX_PAGE_SIZE) || 100,
		},
		limits: {
			maxFavorites: Number(env.MAX_FAVORITES_LIMIT) || 1000,
			maxBulkInsert: Number(env.MAX_BULK_INSERT) || 100,
			maxSearchResults: Number(env.MAX_SEARCH_RESULTS) || 500,
		},
		time: {
			recentArticlesDays: Number(env.RECENT_ARTICLES_DAYS) || 3,
			jstOffsetHours: Number(env.JST_OFFSET_HOURS) || 9,
		},
		timeout: {
			dbQueryTimeout: Number(env.DB_QUERY_TIMEOUT) || 30000,
			requestTimeout: Number(env.REQUEST_TIMEOUT) || 60000,
		},
	};
}

/**
 * デフォルト設定（環境変数なしの場合）
 */
export const DEFAULT_CONFIG = createConfig();

/**
 * ページネーション関連の設定（後方互換性のため）
 */
export const PAGINATION_CONFIG = DEFAULT_CONFIG.pagination;

/**
 * 処理制限に関する設定（後方互換性のため）
 */
export const LIMITS_CONFIG = DEFAULT_CONFIG.limits;

/**
 * 時間関連の設定（後方互換性のため）
 */
export const TIME_CONFIG = DEFAULT_CONFIG.time;

/**
 * タイムアウト設定（後方互換性のため）
 */
export const TIMEOUT_CONFIG = DEFAULT_CONFIG.timeout;

/**
 * すべての設定を統合したオブジェクト（後方互換性のため）
 */
export const CONFIG = DEFAULT_CONFIG;

/**
 * 設定値の検証
 */
export function validateConfig(config: Config = DEFAULT_CONFIG): void {
	// ページネーション設定の検証
	if (config.pagination.defaultPageSize > config.pagination.maxPageSize) {
		throw new Error("DEFAULT_PAGE_SIZE cannot be greater than MAX_PAGE_SIZE");
	}

	// 制限値の検証
	if (config.limits.maxFavorites <= 0) {
		throw new Error("MAX_FAVORITES_LIMIT must be greater than 0");
	}

	if (config.limits.maxBulkInsert <= 0) {
		throw new Error("MAX_BULK_INSERT must be greater than 0");
	}

	// 時間設定の検証
	if (config.time.recentArticlesDays <= 0) {
		throw new Error("RECENT_ARTICLES_DAYS must be greater than 0");
	}

	if (config.time.jstOffsetHours < -12 || config.time.jstOffsetHours > 14) {
		throw new Error("JST_OFFSET_HOURS must be between -12 and 14");
	}

	// タイムアウト設定の検証
	if (config.timeout.dbQueryTimeout <= 0) {
		throw new Error("DB_QUERY_TIMEOUT must be greater than 0");
	}

	if (config.timeout.requestTimeout <= 0) {
		throw new Error("REQUEST_TIMEOUT must be greater than 0");
	}
}

if (import.meta.vitest) {
	const { test, expect, describe, beforeEach, afterEach } = import.meta.vitest;

	describe("Configuration Module", () => {
		// @ts-ignore: process is available in test environment
		const originalEnv =
			typeof process !== "undefined" ? { ...process.env } : {};

		beforeEach(() => {
			// テスト環境でのみ環境変数をリセット
			// @ts-ignore: process is available in test environment
			if (typeof process !== "undefined") {
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
			}
		});

		afterEach(() => {
			// テスト環境でのみ環境変数を復元
			// @ts-ignore: process is available in test environment
			if (typeof process !== "undefined") {
				process.env = { ...originalEnv };
			}
		});

		test("デフォルト設定値が正しく設定されている", () => {
			const config = createConfig();
			expect(config.pagination.defaultOffset).toBe(0);
			expect(config.pagination.defaultPageSize).toBe(20);
			expect(config.pagination.maxPageSize).toBe(100);
			expect(config.limits.maxFavorites).toBe(1000);
			expect(config.limits.maxBulkInsert).toBe(100);
			expect(config.time.recentArticlesDays).toBe(3);
			expect(config.time.jstOffsetHours).toBe(9);
		});

		test("設定値検証が正常に動作する", () => {
			const config = createConfig();
			expect(() => validateConfig(config)).not.toThrow();
		});

		describe("createConfig 関数テスト", () => {
			test("環境変数が設定されている場合は環境変数の値を使用する", () => {
				const testEnv: ConfigEnv = {
					DEFAULT_OFFSET: "10",
					DEFAULT_PAGE_SIZE: "50",
					MAX_FAVORITES_LIMIT: "2000",
				};

				const config = createConfig(testEnv);

				expect(config.pagination.defaultOffset).toBe(10);
				expect(config.pagination.defaultPageSize).toBe(50);
				expect(config.limits.maxFavorites).toBe(2000);
			});

			test("無効な環境変数（非数値）の場合はデフォルト値を使用する", () => {
				const testEnv: ConfigEnv = {
					DEFAULT_OFFSET: "invalid",
					MAX_FAVORITES_LIMIT: "not_a_number",
				};

				const config = createConfig(testEnv);

				expect(config.pagination.defaultOffset).toBe(0);
				expect(config.limits.maxFavorites).toBe(1000);
			});
		});

		describe("validateConfig エラーケース", () => {
			test("DEFAULT_PAGE_SIZE > MAX_PAGE_SIZE でエラーが発生する", () => {
				const testConfig = createConfig({
					DEFAULT_PAGE_SIZE: "150",
					MAX_PAGE_SIZE: "100",
				});

				expect(() => validateConfig(testConfig)).toThrow(
					"DEFAULT_PAGE_SIZE cannot be greater than MAX_PAGE_SIZE",
				);
			});

			test("MAX_FAVORITES_LIMIT <= 0 でエラーが発生する", () => {
				const testConfig: Config = {
					pagination: DEFAULT_CONFIG.pagination,
					limits: {
						...DEFAULT_CONFIG.limits,
						maxFavorites: 0,
					},
					time: DEFAULT_CONFIG.time,
					timeout: DEFAULT_CONFIG.timeout,
				};

				expect(() => validateConfig(testConfig)).toThrow(
					"MAX_FAVORITES_LIMIT must be greater than 0",
				);
			});

			test("MAX_BULK_INSERT <= 0 でエラーが発生する", () => {
				const testConfig = createConfig({
					MAX_BULK_INSERT: "-1",
				});

				expect(() => validateConfig(testConfig)).toThrow(
					"MAX_BULK_INSERT must be greater than 0",
				);
			});

			test("RECENT_ARTICLES_DAYS <= 0 でエラーが発生する", () => {
				const testConfig: Config = {
					pagination: DEFAULT_CONFIG.pagination,
					limits: DEFAULT_CONFIG.limits,
					time: {
						...DEFAULT_CONFIG.time,
						recentArticlesDays: 0,
					},
					timeout: DEFAULT_CONFIG.timeout,
				};

				expect(() => validateConfig(testConfig)).toThrow(
					"RECENT_ARTICLES_DAYS must be greater than 0",
				);
			});

			test("JST_OFFSET_HOURS < -12 でエラーが発生する", () => {
				const testConfig = createConfig({
					JST_OFFSET_HOURS: "-13",
				});

				expect(() => validateConfig(testConfig)).toThrow(
					"JST_OFFSET_HOURS must be between -12 and 14",
				);
			});

			test("JST_OFFSET_HOURS > 14 でエラーが発生する", () => {
				const testConfig = createConfig({
					JST_OFFSET_HOURS: "15",
				});

				expect(() => validateConfig(testConfig)).toThrow(
					"JST_OFFSET_HOURS must be between -12 and 14",
				);
			});

			test("DB_QUERY_TIMEOUT <= 0 でエラーが発生する", () => {
				const testConfig: Config = {
					pagination: DEFAULT_CONFIG.pagination,
					limits: DEFAULT_CONFIG.limits,
					time: DEFAULT_CONFIG.time,
					timeout: {
						...DEFAULT_CONFIG.timeout,
						dbQueryTimeout: 0,
					},
				};

				expect(() => validateConfig(testConfig)).toThrow(
					"DB_QUERY_TIMEOUT must be greater than 0",
				);
			});

			test("REQUEST_TIMEOUT <= 0 でエラーが発生する", () => {
				const testConfig = createConfig({
					REQUEST_TIMEOUT: "-1000",
				});

				expect(() => validateConfig(testConfig)).toThrow(
					"REQUEST_TIMEOUT must be greater than 0",
				);
			});
		});

		describe("process.env 使用時のテスト（Node.js環境のみ）", () => {
			test("process.envが利用可能な場合の環境変数読み込み", () => {
				// @ts-ignore: process is available in test environment
				if (typeof process !== "undefined") {
					process.env.DEFAULT_OFFSET = "10";
					process.env.DEFAULT_PAGE_SIZE = "50";
					process.env.MAX_FAVORITES_LIMIT = "2000";

					const config = createConfig(process.env as ConfigEnv);

					expect(config.pagination.defaultOffset).toBe(10);
					expect(config.pagination.defaultPageSize).toBe(50);
					expect(config.limits.maxFavorites).toBe(2000);
				}
			});
		});
	});
}
