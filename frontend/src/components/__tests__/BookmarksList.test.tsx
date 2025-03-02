import type { ApiBookmarkResponse } from "@/types/api";
import type { Bookmark } from "@/types/bookmark";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Mock, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookmarksList } from "../BookmarksList";

// モック用のレスポンス型
type MockResponse = Response & {
	json: () => Promise<ApiBookmarkResponse>;
	text: () => Promise<string>;
};

// APIレスポンスのモック
const mockBookmarks: Bookmark[] = [
	{
		id: 1,
		url: "https://example.com",
		title: "Example Title",
		isRead: false,
		createdAt: "2024-03-01T00:00:00.000Z",
		updatedAt: "2024-03-01T00:00:00.000Z",
	},
];

describe("BookmarksList", () => {
	beforeEach(() => {
		// fetchのモックをリセット
		vi.restoreAllMocks();
		// コンソールエラーを抑制
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		// コンソールエラーの抑制を解除
		vi.restoreAllMocks();
	});

	it("初期状態で空の配列を表示する", () => {
		render(<BookmarksList initialBookmarks={[]} />);
		expect(screen.getByText("未読のブックマークはありません。")).toBeDefined();
	});

	it("ローディング中は更新ボタンが無効になる", async () => {
		// fetchのモックを設定
		global.fetch = vi.fn().mockImplementation(
			() =>
				new Promise<MockResponse>((resolve) =>
					setTimeout(
						() =>
							resolve({
								ok: true,
								text: () =>
									Promise.resolve(
										JSON.stringify({ success: true, bookmarks: [] }),
									),
								json: async () => ({ success: true, bookmarks: [] }),
							} as MockResponse),
						100,
					),
				),
		);

		render(<BookmarksList initialBookmarks={[]} />);

		const updateButton = screen.getByRole("button");
		await act(async () => {
			fireEvent.click(updateButton);
		});

		expect(updateButton).toHaveProperty("disabled", true);
		expect(screen.getByText("更新中...")).toBeDefined();
	});

	it("エラー時にエラーメッセージを表示する", async () => {
		// fetchのモックを設定（エラーを返す）
		global.fetch = vi.fn().mockRejectedValue(new Error("API Error"));

		render(<BookmarksList initialBookmarks={[]} />);

		await act(async () => {
			// 非同期処理の完了を待つ
			await new Promise((resolve) => setTimeout(resolve, 0));
		});

		expect(screen.getByText("ブックマークの取得に失敗しました")).toBeDefined();
	});

	it("データ取得後にブックマークを表示する", async () => {
		// fetchのモックを設定（成功レスポンスを返す）
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			text: () =>
				Promise.resolve(
					JSON.stringify({
						success: true,
						bookmarks: mockBookmarks,
					}),
				),
			json: () =>
				Promise.resolve({
					success: true,
					bookmarks: mockBookmarks,
				}),
		} as MockResponse);

		render(<BookmarksList initialBookmarks={[]} />);

		await act(async () => {
			// 非同期処理の完了を待つ
			await new Promise((resolve) => setTimeout(resolve, 0));
			it("複数のブックマークを正しく表示する", async () => {
				const multipleBookmarks = [
					{
						id: 1,
						url: "https://example.com",
						title: "Example Title 1",
						isRead: false,
						createdAt: "2024-03-01T00:00:00.000Z",
						updatedAt: "2024-03-01T00:00:00.000Z",
					},
					{
						id: 2,
						url: "https://example.org",
						title: "Example Title 2",
						isRead: false,
						createdAt: "2024-03-02T00:00:00.000Z",
						updatedAt: "2024-03-02T00:00:00.000Z",
					},
				];

				global.fetch = vi.fn().mockResolvedValue({
					ok: true,
					text: () =>
						Promise.resolve(
							JSON.stringify({
								success: true,
								bookmarks: multipleBookmarks,
							}),
						),
					json: () =>
						Promise.resolve({
							success: true,
							bookmarks: multipleBookmarks,
						}),
				} as MockResponse);

				render(<BookmarksList initialBookmarks={[]} />);

				await act(async () => {
					await new Promise((resolve) => setTimeout(resolve, 0));
				});

				expect(screen.getByText("Example Title 1")).toBeDefined();
				expect(screen.getByText("Example Title 2")).toBeDefined();
			});

			it("最新のブックマークが先頭に表示される", async () => {
				const sortedBookmarks = [
					{
						id: 2,
						url: "https://example.org",
						title: "Newer Bookmark",
						isRead: false,
						createdAt: "2024-03-02T00:00:00.000Z",
						updatedAt: "2024-03-02T00:00:00.000Z",
					},
					{
						id: 1,
						url: "https://example.com",
						title: "Older Bookmark",
						isRead: false,
						createdAt: "2024-03-01T00:00:00.000Z",
						updatedAt: "2024-03-01T00:00:00.000Z",
					},
				];

				global.fetch = vi.fn().mockResolvedValue({
					ok: true,
					text: () =>
						Promise.resolve(
							JSON.stringify({
								success: true,
								bookmarks: sortedBookmarks,
							}),
						),
					json: () =>
						Promise.resolve({
							success: true,
							bookmarks: sortedBookmarks,
						}),
				} as MockResponse);

				render(<BookmarksList initialBookmarks={[]} />);

				await act(async () => {
					await new Promise((resolve) => setTimeout(resolve, 0));
				});

				const titles = screen.getAllByRole("heading").map((h) => h.textContent);
				expect(titles[0]).toBe("Newer Bookmark");
				expect(titles[1]).toBe("Older Bookmark");
			});
		});

		expect(screen.getByText("Example Title")).toBeDefined();
	});
});
