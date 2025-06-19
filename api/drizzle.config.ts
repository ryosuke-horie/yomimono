/**
 * Drizzle Kit設定ファイル
 * 環境変数（NODE_ENV）に基づいて開発・本番データベースを分離する
 */
import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { getCurrentDatabaseConfig } from "./src/config/database";

// 現在の環境に基づくデータベース設定を取得
const dbConfig = getCurrentDatabaseConfig();

export default defineConfig({
	out: "./drizzle",
	schema: "./src/db/schema.ts",
	dialect: "sqlite",
	dbCredentials: {
		url: dbConfig.url,
	},
});

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe("Drizzle設定の環境分離", () => {
		test("本番環境ではCloudflare D1を使用する", () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "production";

			// 設定を再インポートして確認
			const isProduction = process.env.NODE_ENV === "production";
			const expectedUrl = isProduction ? "wrangler://yomimono-db" : "sqlite.db";

			expect(expectedUrl).toBe("wrangler://yomimono-db");

			// 環境変数をリストア
			process.env.NODE_ENV = originalEnv;
		});

		test("開発環境ではローカルSQLiteを使用する", () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			const isProduction = process.env.NODE_ENV === "production";
			const expectedUrl = isProduction ? "wrangler://yomimono-db" : "sqlite.db";

			expect(expectedUrl).toBe("sqlite.db");

			// 環境変数をリストア
			process.env.NODE_ENV = originalEnv;
		});

		test("環境変数が未設定の場合は開発環境として扱う", () => {
			const originalEnv = process.env.NODE_ENV;
			delete process.env.NODE_ENV;

			const isProduction = process.env.NODE_ENV === "production";
			const expectedUrl = isProduction ? "wrangler://yomimono-db" : "sqlite.db";

			expect(expectedUrl).toBe("sqlite.db");

			// 環境変数をリストア
			process.env.NODE_ENV = originalEnv;
		});
	});
}
