/**
 * タイムゾーン設定とフォーマット設定の定数定義
 */

/**
 * タイムゾーン設定を作成する関数
 */
export function createTimezoneConfig() {
	return {
		default: "Asia/Tokyo",
		format: {
			dateOnly: "YYYY-MM-DD",
			datetime: "YYYY-MM-DD HH:mm:ss",
		},
	} as const;
}

/**
 * デフォルトのタイムゾーン設定
 */
export const TIMEZONE_CONFIG = createTimezoneConfig();
