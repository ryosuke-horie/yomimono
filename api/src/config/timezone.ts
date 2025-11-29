/**
 * タイムゾーン設定とフォーマット設定の定数定義
 */

/**
 * タイムゾーン環境変数のインターフェース
 */
interface TimezoneEnv {
	DEFAULT_TIMEZONE?: string;
}

/**
 * タイムゾーン設定を作成する関数
 */
export function createTimezoneConfig(env: TimezoneEnv = {}) {
	return {
		default: env.DEFAULT_TIMEZONE || "Asia/Tokyo",
		format: {
			dateOnly: "YYYY-MM-DD",
			datetime: "YYYY-MM-DD HH:mm:ss",
		},
	} as const;
}

/**
 * デフォルトのタイムゾーン設定（後方互換性のため）
 */
export const TIMEZONE_CONFIG = createTimezoneConfig();
