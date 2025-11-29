import { describe, expect, test } from "vitest";

import { createTimezoneConfig } from "./timezone";

describe("timezone config", () => {
	test("フォーマット設定が正しく定義されている", () => {
		const config = createTimezoneConfig();
		expect(config.format.dateOnly).toBe("YYYY-MM-DD");
		expect(config.format.datetime).toBe("YYYY-MM-DD HH:mm:ss");
	});
});
