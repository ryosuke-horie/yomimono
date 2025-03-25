import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBookmarks } from "../useBookmarks";

// グローバルのfetchをモック化
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useBookmarks", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getUnreadBookmarks", () => {
		it("未読ブックマークと総数を取得できる", async () => {
			const mockBookmarks = [
				{
					id: 1,
					url: "https://example.com",
					title: "Example",
					isRead: false,
					createdAt: "2024-03-01T00:00:00.000Z",
					updatedAt: "2024-03-01T00:00:00.000Z",
				},
			];

			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () =>
					Promise.resolve(
						JSON.stringify({
							success: true,
							bookmarks: mockBookmarks,
							totalUnread: 5,
						}),
					),
				json: () =>
					Promise.resolve({
						success: true,
						bookmarks: mockBookmarks,
						totalUnread: 5,
					}),
			});

			const { result } = renderHook(() => useBookmarks());

			const data = await act(async () => {
				return await result.current.getUnreadBookmarks();
			});

			expect(data).toEqual({
				bookmarks: mockBookmarks,
				totalUnread: 5,
			});
		});

		it("APIがエラーを返した場合、例外をスローする", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () =>
					Promise.resolve(
						JSON.stringify({ success: false, message: "API error" }),
					),
				json: () => Promise.resolve({ success: false, message: "API error" }),
			});

			const { result } = renderHook(() => useBookmarks());

			await expect(result.current.getUnreadBookmarks()).rejects.toThrow(
				"API error",
			);
		});

		it("HTTPエラーの場合、例外をスローする", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: () => Promise.resolve("Internal Server Error"),
				json: () => Promise.reject(new Error("Failed to parse JSON")),
			});

			const { result } = renderHook(() => useBookmarks());

			await expect(result.current.getUnreadBookmarks()).rejects.toThrow(
				"Failed to fetch bookmarks: 500",
			);
		});
	});

	describe("markAsRead", () => {
		it("ブックマークを既読にできる", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () => Promise.resolve(JSON.stringify({ success: true })),
				json: () => Promise.resolve({ success: true }),
			});

			const { result } = renderHook(() => useBookmarks());

			await act(async () => {
				await result.current.markAsRead(1);
			});

			expect(mockFetch).toHaveBeenCalledTimes(1);
		});

		it("APIがエラーを返した場合、例外をスローする", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				text: () =>
					Promise.resolve(
						JSON.stringify({ success: false, message: "API error" }),
					),
				json: () => Promise.resolve({ success: false, message: "API error" }),
			});

			const { result } = renderHook(() => useBookmarks());

			await expect(result.current.markAsRead(1)).rejects.toThrow("API error");
		});

		it("HTTPエラーの場合、例外をスローする", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: () => Promise.resolve("Internal Server Error"),
				json: () => Promise.reject(new Error("Failed to parse JSON")),
			});

			const { result } = renderHook(() => useBookmarks());

			await expect(result.current.markAsRead(1)).rejects.toThrow(
				"Failed to mark as read: 500",
			);
		});
	});
});
