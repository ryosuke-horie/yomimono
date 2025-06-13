/**
 * タイムゾーン設定とフォーマット設定の定数定義
 */

/**
 * タイムゾーン環境変数のインターフェース
 */
export interface TimezoneEnv {
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

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe("Timezone Configuration", () => {
		test("デフォルトのタイムゾーンが設定されている", () => {
			const config = createTimezoneConfig();
			expect(config.default).toBe("Asia/Tokyo");
		});

		test("フォーマット設定が正しく定義されている", () => {
			const config = createTimezoneConfig();
			expect(config.format.dateOnly).toBe("YYYY-MM-DD");
			expect(config.format.datetime).toBe("YYYY-MM-DD HH:mm:ss");
		});

		test("環境変数でタイムゾーンをカスタマイズできる", () => {
			const config = createTimezoneConfig({
				DEFAULT_TIMEZONE: "America/New_York",
			});
			expect(config.default).toBe("America/New_York");
		});

		test("後方互換性のためのTIMEZONE_CONFIGが利用可能", () => {
			expect(TIMEZONE_CONFIG.default).toBe("Asia/Tokyo");
			expect(TIMEZONE_CONFIG.format.dateOnly).toBe("YYYY-MM-DD");
			expect(TIMEZONE_CONFIG.format.datetime).toBe("YYYY-MM-DD HH:mm:ss");
		});
	});
}
