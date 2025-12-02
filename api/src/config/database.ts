/**
 * データベース設定ユーティリティ
 * 環境変数に基づいて適切なデータベース設定を返す
 */

interface DatabaseConfig {
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
function getDatabaseConfig(nodeEnv?: string): DatabaseConfig {
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
export function getCurrentDatabaseConfig(
	nodeEnv: string | undefined = process.env.NODE_ENV,
): DatabaseConfig {
	return getDatabaseConfig(nodeEnv);
}
