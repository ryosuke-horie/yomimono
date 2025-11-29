/**
 * 設定管理モジュール
 * 環境変数とデフォルト値を統合した設定システム
 */

/**
 * 環境変数インターフェース
 */
interface ConfigEnv {
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
interface Config {
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

const DEFAULT_CONFIG = createConfig();

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

validateConfig(DEFAULT_CONFIG);

/**
 * すべての設定を統合したオブジェクト
 */
export const CONFIG = DEFAULT_CONFIG;
