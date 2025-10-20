/// <reference types="vitest" />
export const labelKeys = {
	all: ["labels"] as const,
	lists: () => [...labelKeys.all, "list"] as const,
	list: (filters: string) => [...labelKeys.lists(), { filters }] as const,
	details: () => [...labelKeys.all, "detail"] as const,
	detail: (id: number) => [...labelKeys.details(), id] as const,
};

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("labelKeys.all: 基本キーを返す", () => {
		expect(labelKeys.all).toEqual(["labels"]);
	});

	test("labelKeys.lists: リストキーを返す", () => {
		expect(labelKeys.lists()).toEqual(["labels", "list"]);
	});

	test("labelKeys.list: フィルタ付きリストキーを返す", () => {
		expect(labelKeys.list("技術")).toEqual([
			"labels",
			"list",
			{ filters: "技術" },
		]);
		expect(labelKeys.list("")).toEqual(["labels", "list", { filters: "" }]);
	});

	test("labelKeys.details: 詳細キーを返す", () => {
		expect(labelKeys.details()).toEqual(["labels", "detail"]);
	});

	test("labelKeys.detail: ID付き詳細キーを返す", () => {
		expect(labelKeys.detail(1)).toEqual(["labels", "detail", 1]);
		expect(labelKeys.detail(999)).toEqual(["labels", "detail", 999]);
	});
}
