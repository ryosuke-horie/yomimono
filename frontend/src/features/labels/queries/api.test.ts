/**
 * ラベルAPIのテスト
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "./api";

// グローバルfetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("ラベルAPI", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	describe("fetchLabels", () => {
		it("正常にラベル一覧を取得する", async () => {
			const mockLabels = [
				{ id: 1, name: "技術", description: "技術記事" },
				{ id: 2, name: "ビジネス", description: null },
			];
			const mockResponse = { success: true, labels: mockLabels };

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await api.fetchLabels();

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/labels"),
			);
			expect(result).toEqual(mockLabels);
		});

		it("HTTPエラー時に例外を投げる", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
			});

			await expect(api.fetchLabels()).rejects.toThrow("Failed to fetch labels");
		});
	});

	describe("createLabel", () => {
		it("正常にラベルを作成する", async () => {
			const newLabel = { id: 3, name: "新ラベル", description: "説明文" };
			const mockResponse = { success: true, label: newLabel };

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await api.createLabel("新ラベル", "説明文");

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/labels"),
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "新ラベル", description: "説明文" }),
				},
			);
			expect(result).toEqual(newLabel);
		});

		it("説明文なしでラベルを作成する", async () => {
			const newLabel = { id: 4, name: "ラベル", description: null };
			const mockResponse = { success: true, label: newLabel };

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await api.createLabel("ラベル");

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/labels"),
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "ラベル", description: undefined }),
				},
			);
			expect(result).toEqual(newLabel);
		});

		it("エラーレスポンス時に例外を投げる", async () => {
			const errorResponse = {
				success: false,
				message: "ラベル名が重複しています",
			};

			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve(errorResponse),
			});

			await expect(api.createLabel("重複ラベル")).rejects.toThrow(
				"ラベル名が重複しています",
			);
		});
	});

	describe("updateLabelDescription", () => {
		it("正常にラベル説明文を更新する", async () => {
			const updatedLabel = {
				id: 1,
				name: "技術",
				description: "更新された説明文",
			};
			const mockResponse = { success: true, label: updatedLabel };

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await api.updateLabelDescription(1, "更新された説明文");

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/labels/1"),
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ description: "更新された説明文" }),
				},
			);
			expect(result).toEqual(updatedLabel);
		});

		it("説明文をnullに設定する", async () => {
			const updatedLabel = { id: 1, name: "技術", description: null };
			const mockResponse = { success: true, label: updatedLabel };

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await api.updateLabelDescription(1, null);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/labels/1"),
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ description: null }),
				},
			);
			expect(result).toEqual(updatedLabel);
		});

		it("HTTPエラー時に例外を投げる", async () => {
			const errorResponse = {
				success: false,
				message: "ラベルが見つかりません",
			};

			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve(errorResponse),
			});

			await expect(api.updateLabelDescription(999, "説明文")).rejects.toThrow(
				"ラベルが見つかりません",
			);
		});
	});

	describe("deleteLabel", () => {
		it("正常にラベルを削除する", async () => {
			const mockResponse = { success: true, message: "ラベルを削除しました" };

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await api.deleteLabel(1);

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/labels/1"),
				{
					method: "DELETE",
				},
			);
			expect(result).toBe("ラベルを削除しました");
		});

		it("HTTPエラー時に例外を投げる", async () => {
			const errorResponse = { success: false, message: "削除に失敗しました" };

			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve(errorResponse),
			});

			await expect(api.deleteLabel(1)).rejects.toThrow("削除に失敗しました");
		});
	});

	describe("cleanupUnusedLabels", () => {
		it("正常に未使用ラベルを一括削除する", async () => {
			const deletedLabels = [
				{ id: 2, name: "使用されていないラベル1", description: null },
				{ id: 3, name: "使用されていないラベル2", description: "古いラベル" },
			];
			const mockResponse = {
				success: true,
				message: "Successfully cleaned up 2 unused labels",
				deletedCount: 2,
				deletedLabels,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await api.cleanupUnusedLabels();

			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining("/api/labels/cleanup"),
				{
					method: "DELETE",
				},
			);
			expect(result).toEqual({
				message: "Successfully cleaned up 2 unused labels",
				deletedCount: 2,
				deletedLabels,
			});
		});

		it("削除対象がない場合", async () => {
			const mockResponse = {
				success: true,
				message: "Successfully cleaned up 0 unused labels",
				deletedCount: 0,
				deletedLabels: [],
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await api.cleanupUnusedLabels();

			expect(result.deletedCount).toBe(0);
			expect(result.deletedLabels).toEqual([]);
		});

		it("HTTPエラー時に例外を投げる", async () => {
			const errorResponse = {
				success: false,
				message: "クリーンアップに失敗しました",
			};

			mockFetch.mockResolvedValueOnce({
				ok: false,
				json: () => Promise.resolve(errorResponse),
			});

			await expect(api.cleanupUnusedLabels()).rejects.toThrow(
				"クリーンアップに失敗しました",
			);
		});
	});
});
