/**
 * labelKeysの生成ロジックのテスト
 */
import { describe, expect, it } from "vitest";

import { labelKeys } from "./queryKeys";

describe("labelKeys", () => {
	it("all: 基本キーを返す", () => {
		expect(labelKeys.all).toEqual(["labels"]);
	});

	it("lists: リストキーを返す", () => {
		expect(labelKeys.lists()).toEqual(["labels", "list"]);
	});

	it("list: フィルタ付きリストキーを返す", () => {
		expect(labelKeys.list("技術")).toEqual([
			"labels",
			"list",
			{ filters: "技術" },
		]);
		expect(labelKeys.list("")).toEqual(["labels", "list", { filters: "" }]);
	});

	it("details: 詳細キーを返す", () => {
		expect(labelKeys.details()).toEqual(["labels", "detail"]);
	});

	it("detail: ID付き詳細キーを返す", () => {
		expect(labelKeys.detail(1)).toEqual(["labels", "detail", 1]);
		expect(labelKeys.detail(999)).toEqual(["labels", "detail", 999]);
	});
});
