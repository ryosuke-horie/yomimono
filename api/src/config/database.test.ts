import { describe, expect, test } from "vitest";

import { getCurrentDatabaseConfig, getDatabaseConfig } from "./database";

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
		const productionConfig = getCurrentDatabaseConfig("production");
		expect(productionConfig.environment).toBe("production");

		const developmentConfig = getCurrentDatabaseConfig("development");
		expect(developmentConfig.environment).toBe("development");
	});
});
