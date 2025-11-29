import { describe, expect, test } from "vitest";
import { CONFIG, createConfig, validateConfig } from "./index";

describe("Config", () => {
	describe("createConfig", () => {
		test("デフォルト値で設定オブジェクトを作成する", () => {
			const config = createConfig();
			expect(config.pagination.defaultOffset).toBe(0);
			expect(config.pagination.defaultPageSize).toBe(20);
			expect(config.pagination.maxPageSize).toBe(100);
			expect(config.limits.maxFavorites).toBe(1000);
			expect(config.limits.maxBulkInsert).toBe(100);
			expect(config.limits.maxSearchResults).toBe(500);
			expect(config.time.recentArticlesDays).toBe(3);
			expect(config.time.jstOffsetHours).toBe(9);
			expect(config.timeout.dbQueryTimeout).toBe(30000);
			expect(config.timeout.requestTimeout).toBe(60000);
		});

		test("環境変数から設定オブジェクトを作成する", () => {
			const config = createConfig({
				DEFAULT_OFFSET: "10",
				DEFAULT_PAGE_SIZE: "50",
				MAX_PAGE_SIZE: "200",
				MAX_FAVORITES_LIMIT: "500",
				MAX_BULK_INSERT: "50",
				MAX_SEARCH_RESULTS: "250",
				RECENT_ARTICLES_DAYS: "7",
				JST_OFFSET_HOURS: "5",
				DB_QUERY_TIMEOUT: "5000",
				REQUEST_TIMEOUT: "10000",
			});
			expect(config.pagination.defaultOffset).toBe(10);
			expect(config.pagination.defaultPageSize).toBe(50);
			expect(config.pagination.maxPageSize).toBe(200);
			expect(config.limits.maxFavorites).toBe(500);
			expect(config.limits.maxBulkInsert).toBe(50);
			expect(config.limits.maxSearchResults).toBe(250);
			expect(config.time.recentArticlesDays).toBe(7);
			expect(config.time.jstOffsetHours).toBe(5);
			expect(config.timeout.dbQueryTimeout).toBe(5000);
			expect(config.timeout.requestTimeout).toBe(10000);
		});

		test("無効な環境変数はデフォルト値を使用する", () => {
			const config = createConfig({
				DEFAULT_PAGE_SIZE: "invalid",
				MAX_PAGE_SIZE: "",
			});
			expect(config.pagination.defaultPageSize).toBe(20);
			expect(config.pagination.maxPageSize).toBe(100);
		});
	});

	describe("validateConfig", () => {
		test("有効な設定を検証する", () => {
			const config = createConfig();
			expect(() => validateConfig(config)).not.toThrow();
		});

		test("DEFAULT_PAGE_SIZE > MAX_PAGE_SIZE の場合エラーをスローする", () => {
			const config = createConfig({
				DEFAULT_PAGE_SIZE: "200",
				MAX_PAGE_SIZE: "100",
			});
			expect(() => validateConfig(config)).toThrow(
				"DEFAULT_PAGE_SIZE cannot be greater than MAX_PAGE_SIZE",
			);
		});

		test("MAX_FAVORITES_LIMIT <= 0 の場合エラーをスローする", () => {
			const config = createConfig({
				MAX_FAVORITES_LIMIT: "-1",
			});
			expect(() => validateConfig(config)).toThrow(
				"MAX_FAVORITES_LIMIT must be greater than 0",
			);
		});

		test("MAX_BULK_INSERT <= 0 の場合エラーをスローする", () => {
			const config = createConfig({
				MAX_BULK_INSERT: "-1",
			});
			expect(() => validateConfig(config)).toThrow(
				"MAX_BULK_INSERT must be greater than 0",
			);
		});

		test("RECENT_ARTICLES_DAYS <= 0 の場合エラーをスローする", () => {
			const config = createConfig({
				RECENT_ARTICLES_DAYS: "-1",
			});
			expect(() => validateConfig(config)).toThrow(
				"RECENT_ARTICLES_DAYS must be greater than 0",
			);
		});

		test("JST_OFFSET_HOURS が範囲外の場合エラーをスローする", () => {
			const configLow = createConfig({
				JST_OFFSET_HOURS: "-13",
			});
			expect(() => validateConfig(configLow)).toThrow(
				"JST_OFFSET_HOURS must be between -12 and 14",
			);

			const configHigh = createConfig({
				JST_OFFSET_HOURS: "15",
			});
			expect(() => validateConfig(configHigh)).toThrow(
				"JST_OFFSET_HOURS must be between -12 and 14",
			);
		});

		test("DB_QUERY_TIMEOUT <= 0 の場合エラーをスローする", () => {
			const config = createConfig({
				DB_QUERY_TIMEOUT: "-1",
			});
			expect(() => validateConfig(config)).toThrow(
				"DB_QUERY_TIMEOUT must be greater than 0",
			);
		});

		test("REQUEST_TIMEOUT <= 0 の場合エラーをスローする", () => {
			const config = createConfig({
				REQUEST_TIMEOUT: "-1",
			});
			expect(() => validateConfig(config)).toThrow(
				"REQUEST_TIMEOUT must be greater than 0",
			);
		});
	});

	describe("CONFIG", () => {
		test("CONFIGがエクスポートされている", () => {
			expect(CONFIG).toBeDefined();
			expect(CONFIG.pagination).toBeDefined();
			expect(CONFIG.limits).toBeDefined();
			expect(CONFIG.time).toBeDefined();
			expect(CONFIG.timeout).toBeDefined();
		});
	});
});
