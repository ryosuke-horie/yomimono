import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/dom";
import { markBookmarkAsRead } from "@/lib/api/bookmarks";
import type { Bookmark } from "@/types/bookmark";
import { BookmarkCard } from "../BookmarkCard";

describe("BookmarkCard", () => {
	const mockBookmark: Bookmark = {
		id: 1,
		url: "https://example.com",
		title: "Example Title",
		isRead: false,
		createdAt: "2024-03-01T00:00:00.000Z",
		updatedAt: "2024-03-01T00:00:00.000Z",
	};

	it("タイトルが存在する場合、そのタイトルを表示する", () => {
		render(<BookmarkCard bookmark={mockBookmark} />);
		expect(screen.getByText("Example Title")).toBeDefined();
	});

	it("タイトルがnullの場合、「タイトルなし」を表示する", () => {
		const bookmarkWithoutTitle = { ...mockBookmark, title: null };
		render(<BookmarkCard bookmark={bookmarkWithoutTitle} />);
		expect(screen.getByText("タイトルなし")).toBeDefined();
	});

	it("URLを表示する", () => {
		render(<BookmarkCard bookmark={mockBookmark} />);
		expect(screen.getByText("https://example.com")).toBeDefined();
	});

	it("日付を日本語形式で表示する", () => {
		render(<BookmarkCard bookmark={mockBookmark} />);
		expect(screen.getByText("2024/3/1")).toBeDefined();
	});

	it("リンクが適切な属性を持つ", () => {
		render(<BookmarkCard bookmark={mockBookmark} />);
		const link = screen.getByRole("link");
		expect(link.getAttribute("href")).toBe("https://example.com");
		expect(link.getAttribute("target")).toBe("_blank");
		expect(link.getAttribute("rel")).toBe("noopener noreferrer");
	});

	vi.mock("@/lib/api/bookmarks", () => ({
		markBookmarkAsRead: vi.fn(),
	}));

	describe("既読機能", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		const mockMarkAsRead = vi.mocked(markBookmarkAsRead);

		it("未読の場合、クリック可能なチェックマークアイコンを表示する", () => {
			render(<BookmarkCard bookmark={mockBookmark} />);
			const button = screen.getByTitle("既読にする");
			expect(button.hasAttribute("disabled")).toBe(false);
		});

		it("既読の場合、無効化されたチェックマークアイコンを表示する", () => {
			const readBookmark = { ...mockBookmark, isRead: true };
			render(<BookmarkCard bookmark={readBookmark} />);
			const button = screen.getByTitle("既読済み");
			expect(button.hasAttribute("disabled")).toBe(true);
		});

		it("既読の場合、背景色が変更される", () => {
			const readBookmark = { ...mockBookmark, isRead: true };
			render(<BookmarkCard bookmark={readBookmark} />);
			const card = screen.getByRole("article");
			expect(card.classList.contains("bg-gray-50")).toBe(true);
		});

		it("チェックマークをクリックすると既読APIを呼び出す", async () => {
			const onUpdate = vi.fn();
			render(<BookmarkCard bookmark={mockBookmark} onUpdate={onUpdate} />);
			const button = screen.getByTitle("既読にする");

			await fireEvent.click(button);

			expect(mockMarkAsRead).toHaveBeenCalledWith(mockBookmark.id);
			expect(onUpdate).toHaveBeenCalled();
		});

		it("API呼び出しが失敗しても例外をキャッチする", async () => {
			const error = new Error("API error");
			mockMarkAsRead.mockRejectedValueOnce(error);
			const consoleSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});

			render(<BookmarkCard bookmark={mockBookmark} />);
			const button = screen.getByTitle("既読にする");

			await fireEvent.click(button);

			expect(consoleSpy).toHaveBeenCalledWith("Failed to mark as read:", error);
			consoleSpy.mockRestore();
		});
	});
});
