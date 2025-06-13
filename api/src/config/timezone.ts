/**
 * タイムゾーン設定とフォーマット設定の定数定義
 */
export const TIMEZONE_CONFIG = {
	default: process.env.DEFAULT_TIMEZONE || "Asia/Tokyo",
	format: {
		dateOnly: "YYYY-MM-DD",
		datetime: "YYYY-MM-DD HH:mm:ss",
	},
} as const;

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("デフォルトのタイムゾーンが設定されている", () => {
		expect(TIMEZONE_CONFIG.default).toBe("Asia/Tokyo");
	});

	test("フォーマット設定が正しく定義されている", () => {
		expect(TIMEZONE_CONFIG.format.dateOnly).toBe("YYYY-MM-DD");
		expect(TIMEZONE_CONFIG.format.datetime).toBe("YYYY-MM-DD HH:mm:ss");
	});
}
