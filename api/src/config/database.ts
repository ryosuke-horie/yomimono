/**
 * データベース設定ユーティリティ
 * 環境変数に基づいて適切なデータベース設定を返す
 */

export interface DatabaseConfig {
	/** データベースURL */
	url: string;
	/** 環境名 */
	environment: "development" | "production";
	/** データベース名 */
	databaseName: string;
}

/**
 * 環境変数に基づいてデータベース設定を取得する
 * @param nodeEnv NODE_ENV環境変数の値
 * @returns データベース設定オブジェクト
 */
export function getDatabaseConfig(nodeEnv?: string): DatabaseConfig {
	const isProduction = nodeEnv === "production";

	if (isProduction) {
		return {
			url: "wrangler://yomimono-db",
			environment: "production",
			databaseName: "yomimono-db",
		};
	}

	return {
		url: "sqlite.db",
		environment: "development",
		databaseName: "yomimono-db-dev",
	};
}

/**
 * 現在の環境に基づくデータベース設定を取得する
 * @returns 現在の環境のデータベース設定
 */
export function getCurrentDatabaseConfig(): DatabaseConfig {
	return getDatabaseConfig(process.env.NODE_ENV);
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe("getDatabaseConfig", () => {
		test("本番環境の設定を正しく返す", () => {
			const config = getDatabaseConfig("production");

			expect(config).toEqual({
				url: "wrangler://yomimono-db",
				environment: "production",
				databaseName: "yomimono-db",
			});
		});

		test("開発環境の設定を正しく返す", () => {
			const config = getDatabaseConfig("development");

			expect(config).toEqual({
				url: "sqlite.db",
				environment: "development",
				databaseName: "yomimono-db-dev",
			});
		});

		test("環境変数が未設定の場合は開発環境設定を返す", () => {
			const config = getDatabaseConfig(undefined);

			expect(config).toEqual({
				url: "sqlite.db",
				environment: "development",
				databaseName: "yomimono-db-dev",
			});
		});

		test("予期しない環境変数の場合は開発環境設定を返す", () => {
			const config = getDatabaseConfig("staging");

			expect(config).toEqual({
				url: "sqlite.db",
				environment: "development",
				databaseName: "yomimono-db-dev",
			});
		});
	});

	describe("getCurrentDatabaseConfig", () => {
		test("現在の環境変数に基づいて設定を返す", () => {
			const originalEnv = process.env.NODE_ENV;

			// 本番環境をテスト
			process.env.NODE_ENV = "production";
			let config = getCurrentDatabaseConfig();
			expect(config.environment).toBe("production");

			// 開発環境をテスト
			process.env.NODE_ENV = "development";
			config = getCurrentDatabaseConfig();
			expect(config.environment).toBe("development");

			// 環境変数をリストア
			process.env.NODE_ENV = originalEnv;
		});
	});
}
