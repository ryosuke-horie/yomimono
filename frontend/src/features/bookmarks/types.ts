/**
 * ブックマーク関連の型定義
 */
import type { Label } from "../labels/types";

export interface Bookmark {
	id: number;
	url: string;
	title: string | null;
	isRead: boolean;
	isFavorite: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface BookmarkWithLabel extends Bookmark {
	label: Label | null;
}

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe("Bookmark型", () => {
		it("Bookmark型のプロパティが正しく定義されている", () => {
			const bookmark: Bookmark = {
				id: 1,
				url: "https://example.com",
				title: "テスト記事",
				isRead: false,
				isFavorite: false,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			};
			expect(bookmark.id).toBe(1);
			expect(bookmark.url).toBe("https://example.com");
		});

		it("BookmarkWithLabel型のプロパティが正しく定義されている", () => {
			const bookmarkWithLabel: BookmarkWithLabel = {
				id: 1,
				url: "https://example.com",
				title: "テスト記事",
				isRead: false,
				isFavorite: false,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
				label: null,
			};
			expect(bookmarkWithLabel.label).toBeNull();
		});
	});
}
