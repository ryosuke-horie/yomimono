/**
 * 本棚機能のReact Queryキー定義
 */

import type { BookStatusValue } from "@/features/bookshelf/types";

export const bookshelfKeys = {
	all: ["bookshelf"] as const,
	lists: () => [...bookshelfKeys.all, "list"] as const,
	list: (status?: BookStatusValue) =>
		[...bookshelfKeys.lists(), { status }] as const,
	details: () => [...bookshelfKeys.all, "detail"] as const,
	detail: (id: number) => [...bookshelfKeys.details(), id] as const,
} as const;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe("bookshelfKeys", () => {
		it("all キーが正しく生成される", () => {
			expect(bookshelfKeys.all).toEqual(["bookshelf"]);
		});

		it("lists キーが正しく生成される", () => {
			expect(bookshelfKeys.lists()).toEqual(["bookshelf", "list"]);
		});

		it("list キーがステータスなしで正しく生成される", () => {
			expect(bookshelfKeys.list()).toEqual([
				"bookshelf",
				"list",
				{ status: undefined },
			]);
		});

		it("list キーがステータス付きで正しく生成される", () => {
			expect(bookshelfKeys.list("reading")).toEqual([
				"bookshelf",
				"list",
				{ status: "reading" },
			]);
		});

		it("details キーが正しく生成される", () => {
			expect(bookshelfKeys.details()).toEqual(["bookshelf", "detail"]);
		});

		it("detail キーが正しく生成される", () => {
			expect(bookshelfKeys.detail(1)).toEqual(["bookshelf", "detail", 1]);
		});
	});
}
