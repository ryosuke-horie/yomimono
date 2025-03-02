import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom";
import type { Bookmark } from "@/types/bookmark";
import { BookmarkCard } from "../BookmarkCard";

// カスタムフックをモック化
vi.mock("@/hooks/useBookmarks", () => ({
	useBookmarks: () => ({
		markAsRead: vi.fn(),
	}),
}));

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

	it("既読ボタンをクリックするとonUpdateが呼ばれる", async () => {
		const onUpdate = vi.fn();
		render(<BookmarkCard bookmark={mockBookmark} onUpdate={onUpdate} />);

		const button = screen.getByTitle("既読にする");
		await fireEvent.click(button);

		expect(onUpdate).toHaveBeenCalled();
	});

	it("既読の場合、ボタンが無効化される", () => {
		const readBookmark = { ...mockBookmark, isRead: true };
		render(<BookmarkCard bookmark={readBookmark} />);

		const button = screen.getByTitle("既読済み");
		expect(button.hasAttribute("disabled")).toBe(true);
	});

	it("既読の場合、背景色が変更される", () => {
		const readBookmark = { ...mockBookmark, isRead: true };
		render(<BookmarkCard bookmark={readBookmark} />);

		const article = screen.getByRole("article");
		expect(article.classList.contains("bg-gray-50")).toBe(true);
	});
	it("既読マーク処理中にエラーが発生した場合、onUpdateは呼ばれない", async () => {
		const mockError = new Error("Failed to mark as read");
		const mockMarkAsRead = vi.fn().mockRejectedValue(mockError);
		vi.mock("@/hooks/useBookmarks", () => ({
			useBookmarks: () => ({
				markAsRead: mockMarkAsRead,
			}),
		}));

		const onUpdate = vi.fn();
		render(<BookmarkCard bookmark={mockBookmark} onUpdate={onUpdate} />);

		const button = screen.getByTitle("既読にする");
		await fireEvent.click(button);

		expect(mockMarkAsRead).toHaveBeenCalledWith(mockBookmark.id);
		expect(onUpdate).not.toHaveBeenCalled();
		// エラーがコンソールに記録されていることを確認
		expect(console.error).toHaveBeenCalledWith(
			"Failed to mark as read:",
			mockError,
		);
	});

	it("既読マーク処理中はボタンが無効化される", async () => {
		let resolvePromise!: (value: void) => void;
		const markAsReadPromise = new Promise<void>((resolve) => {
			resolvePromise = resolve;
		});
		const mockMarkAsRead = vi.fn().mockReturnValue(markAsReadPromise);

		vi.mock("@/hooks/useBookmarks", () => ({
			useBookmarks: () => ({
				markAsRead: mockMarkAsRead,
			}),
		}));

		render(<BookmarkCard bookmark={mockBookmark} />);
		const button = screen.getByTitle("既読にする");

		fireEvent.click(button);
		expect(button.hasAttribute("disabled")).toBe(true);

		// Promise を解決
		resolvePromise();
		await markAsReadPromise;
	});
});
