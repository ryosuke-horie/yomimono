/// <reference types="vitest" />
import type { Bookmark } from "@/features/bookmarks/types";

interface ApiError {
	code: string;
	message: string;
}

export interface ApiResponse<T> {
	// export を追加
	success: boolean;
	bookmarks?: T[];
	totalUnread?: number;
	todayReadCount?: number;
	message?: string;
	error?: ApiError;
}

export type ApiBookmarkResponse = ApiResponse<Bookmark>;

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("ApiResponse型: 正常レスポンスの型チェック", () => {
		const response: ApiResponse<string> = {
			success: true,
			bookmarks: ["test1", "test2"],
			totalUnread: 5,
			todayReadCount: 2,
			message: "Success",
		};

		expect(response.success).toBe(true);
		expect(response.bookmarks).toEqual(["test1", "test2"]);
		expect(response.totalUnread).toBe(5);
		expect(response.todayReadCount).toBe(2);
		expect(response.message).toBe("Success");
	});

	test("ApiResponse型: エラーレスポンスの型チェック", () => {
		const response: ApiResponse<string> = {
			success: false,
			message: "Error occurred",
			error: {
				code: "INVALID_REQUEST",
				message: "Invalid request format",
			},
		};

		expect(response.success).toBe(false);
		expect(response.message).toBe("Error occurred");
		expect(response.error?.code).toBe("INVALID_REQUEST");
		expect(response.error?.message).toBe("Invalid request format");
	});

	test("ApiBookmarkResponse型: ブックマーク用レスポンスの型チェック", () => {
		const mockBookmark: Bookmark = {
			id: 1,
			title: "テスト記事",
			url: "https://example.com",
			isRead: false,
			isFavorite: false,
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		const response: ApiBookmarkResponse = {
			success: true,
			bookmarks: [mockBookmark],
			totalUnread: 1,
			todayReadCount: 0,
		};

		expect(response.success).toBe(true);
		expect(response.bookmarks?.[0]).toEqual(mockBookmark);
		expect(response.totalUnread).toBe(1);
		expect(response.todayReadCount).toBe(0);
	});

	test("ApiResponse型: 最小限のプロパティでの型チェック", () => {
		const response: ApiResponse<never> = {
			success: true,
		};

		expect(response.success).toBe(true);
		expect(response.bookmarks).toBeUndefined();
		expect(response.totalUnread).toBeUndefined();
		expect(response.todayReadCount).toBeUndefined();
		expect(response.message).toBeUndefined();
		expect(response.error).toBeUndefined();
	});
}
