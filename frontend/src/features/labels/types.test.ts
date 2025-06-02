/**
 * ラベル型定義のテスト
 */
import { describe, expect, it } from "vitest";
import type { Label } from "./types";

describe("ラベル型定義", () => {
	it("Label型が正しく定義されている", () => {
		const label: Label = {
			id: 1,
			name: "テストラベル",
		};

		expect(label).toBeDefined();
		expect(typeof label.id).toBe("number");
		expect(typeof label.name).toBe("string");
	});

	it("Label型のオプショナルプロパティが正しく動作する", () => {
		const label: Label = {
			id: 1,
			name: "詳細ラベル",
			description: "テスト用のラベルです",
			articleCount: 5,
		};

		expect(label.description).toBe("テスト用のラベルです");
		expect(label.articleCount).toBe(5);
	});
});
