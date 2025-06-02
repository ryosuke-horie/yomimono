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
			color: "#ff0000",
		};

		expect(label).toBeDefined();
		expect(typeof label.id).toBe("number");
		expect(typeof label.name).toBe("string");
		expect(typeof label.color).toBe("string");
	});

	it("Label型のcolorプロパティが正しいフォーマットになっている", () => {
		const label: Label = {
			id: 1,
			name: "青いラベル",
			color: "#0000ff",
		};

		expect(label.color).toMatch(/^#[0-9a-fA-F]{6}$/);
	});
});
