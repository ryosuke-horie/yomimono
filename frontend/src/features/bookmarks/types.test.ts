/**
 * ブックマーク型定義のテスト
 */
import { describe, expect, it } from "vitest";
import type { Bookmark, BookmarkWithLabel } from "./types";

describe("ブックマーク型定義", () => {
	it("Bookmark型が正しく定義されている", () => {
		const bookmark: Bookmark = {
			id: 1,
			title: "テスト記事",
			url: "https://example.com",
			createdAt: "2024-01-01T00:00:00.000Z",
			isRead: false,
			isFavorite: false,
		};

		expect(bookmark).toBeDefined();
		expect(typeof bookmark.id).toBe("number");
		expect(typeof bookmark.title).toBe("string");
		expect(typeof bookmark.url).toBe("string");
		expect(typeof bookmark.createdAt).toBe("string");
		expect(typeof bookmark.isRead).toBe("boolean");
		expect(typeof bookmark.isFavorite).toBe("boolean");
	});

	it("BookmarkWithLabel型が正しく定義されている", () => {
		const bookmarkWithLabel: BookmarkWithLabel = {
			id: 1,
			title: "テスト記事",
			url: "https://example.com",
			createdAt: "2024-01-01T00:00:00.000Z",
			isRead: false,
			isFavorite: false,
			label: {
				id: 1,
				name: "テストラベル",
				color: "#ff0000",
			},
		};

		expect(bookmarkWithLabel).toBeDefined();
		expect(bookmarkWithLabel.label).toBeDefined();
		expect(bookmarkWithLabel.label?.name).toBe("テストラベル");
	});

	it("BookmarkWithLabel型でlabelがnullの場合も正しく動作する", () => {
		const bookmarkWithoutLabel: BookmarkWithLabel = {
			id: 1,
			title: "テスト記事",
			url: "https://example.com",
			createdAt: "2024-01-01T00:00:00.000Z",
			isRead: false,
			isFavorite: false,
			label: null,
		};

		expect(bookmarkWithoutLabel).toBeDefined();
		expect(bookmarkWithoutLabel.label).toBeNull();
	});
});
