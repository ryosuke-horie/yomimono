import { describe, expect, test } from "vitest";

import { createTimezoneConfig, TIMEZONE_CONFIG } from "./timezone";

describe("timezone config", () => {
	test("フォーマット設定が正しく定義されている", () => {
		const config = createTimezoneConfig();
		expect(config.format.dateOnly).toBe("YYYY-MM-DD");
		expect(config.format.datetime).toBe("YYYY-MM-DD HH:mm:ss");
	});

	test("後方互換性のためのTIMEZONE_CONFIGが利用可能", () => {
		expect(TIMEZONE_CONFIG.default).toBe("Asia/Tokyo");
		expect(TIMEZONE_CONFIG.format.dateOnly).toBe("YYYY-MM-DD");
		expect(TIMEZONE_CONFIG.format.datetime).toBe("YYYY-MM-DD HH:mm:ss");
	});
});
