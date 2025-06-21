/// <reference types="vitest" />
import { API_BASE_URL } from "@/lib/api/config";
import type { Label } from "../types";

// APIレスポンスの型定義
interface LabelsApiResponse {
	success: boolean;
	labels: Label[];
	message?: string;
}

interface LabelApiResponse {
	success: boolean;
	label: Label;
	message?: string;
}

interface LabelDeleteResponse {
	success: boolean;
	message: string;
}

// エラーレスポンス用の型定義
interface ErrorResponse {
	success: boolean;
	message: string;
}

// ラベル一覧を取得する関数
export const fetchLabels = async (): Promise<Label[]> => {
	const response = await fetch(`${API_BASE_URL}/api/labels`);
	if (!response.ok) {
		throw new Error("Failed to fetch labels");
	}
	const data: LabelsApiResponse = await response.json();
	return data.labels;
};

// 特定のラベルを取得する関数（現在は未使用）
const fetchLabelById = async (id: number): Promise<Label> => {
	const response = await fetch(`${API_BASE_URL}/api/labels/${id}`);
	if (!response.ok) {
		throw new Error(`Failed to fetch label with ID: ${id}`);
	}
	const data: LabelApiResponse = await response.json();
	return data.label;
};

// 新しいラベルを作成する関数
export const createLabel = async (
	name: string,
	description?: string,
): Promise<Label> => {
	const response = await fetch(`${API_BASE_URL}/api/labels`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ name, description }),
	});

	if (!response.ok) {
		const errorData = (await response.json()) as ErrorResponse;
		throw new Error(errorData.message || "Failed to create label");
	}

	const data: LabelApiResponse = await response.json();
	return data.label;
};

// ラベルの説明文を更新する関数
export const updateLabelDescription = async (
	id: number,
	description: string | null,
): Promise<Label> => {
	const response = await fetch(`${API_BASE_URL}/api/labels/${id}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ description }),
	});

	if (!response.ok) {
		const errorData = (await response.json()) as ErrorResponse;
		throw new Error(
			errorData.message || `Failed to update label with ID: ${id}`,
		);
	}

	const data: LabelApiResponse = await response.json();
	return data.label;
};

// ラベルを削除する関数
export const deleteLabel = async (id: number): Promise<string> => {
	const response = await fetch(`${API_BASE_URL}/api/labels/${id}`, {
		method: "DELETE",
	});

	if (!response.ok) {
		const errorData = (await response.json()) as ErrorResponse;
		throw new Error(
			errorData.message || `Failed to delete label with ID: ${id}`,
		);
	}

	const data: LabelDeleteResponse = await response.json();
	return data.message;
};

// 未使用ラベル一括クリーンアップの型定義
interface LabelCleanupResponse {
	success: boolean;
	message: string;
	deletedCount: number;
	deletedLabels: Label[];
}

// 未使用ラベルを一括削除する関数
export const cleanupUnusedLabels = async (): Promise<{
	message: string;
	deletedCount: number;
	deletedLabels: Label[];
}> => {
	const response = await fetch(`${API_BASE_URL}/api/labels/cleanup`, {
		method: "DELETE",
	});

	if (!response.ok) {
		const errorData = (await response.json()) as ErrorResponse;
		throw new Error(
			errorData.message || "Failed to cleanup unused labels",
		);
	}

	const data: LabelCleanupResponse = await response.json();
	return {
		message: data.message,
		deletedCount: data.deletedCount,
		deletedLabels: data.deletedLabels,
	};
};

// @ts-ignore - Vitest in-source testing
if (import.meta.vitest) {
	// @ts-ignore
	const { test, expect, vi, beforeEach, afterEach } = import.meta.vitest;

	// モックのセットアップ
	const mockFetch = vi.fn();
	global.fetch = mockFetch;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	test("fetchLabels: 正常にラベル一覧を取得する", async () => {
		const mockLabels = [
			{ id: 1, name: "技術", description: "技術記事" },
			{ id: 2, name: "ビジネス", description: null },
		];
		const mockResponse = { success: true, labels: mockLabels };

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await fetchLabels();

		expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/labels`);
		expect(result).toEqual(mockLabels);
	});

	test("fetchLabels: HTTPエラー時に例外を投げる", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
		});

		await expect(fetchLabels()).rejects.toThrow("Failed to fetch labels");
	});

	test("createLabel: 正常にラベルを作成する", async () => {
		const newLabel = { id: 3, name: "新ラベル", description: "説明文" };
		const mockResponse = { success: true, label: newLabel };

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await createLabel("新ラベル", "説明文");

		expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/labels`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "新ラベル", description: "説明文" }),
		});
		expect(result).toEqual(newLabel);
	});

	test("createLabel: 説明文なしでラベルを作成する", async () => {
		const newLabel = { id: 4, name: "ラベル", description: null };
		const mockResponse = { success: true, label: newLabel };

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await createLabel("ラベル");

		expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/labels`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: "ラベル", description: undefined }),
		});
		expect(result).toEqual(newLabel);
	});

	test("createLabel: エラーレスポンス時に例外を投げる", async () => {
		const errorResponse = {
			success: false,
			message: "ラベル名が重複しています",
		};

		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: () => Promise.resolve(errorResponse),
		});

		await expect(createLabel("重複ラベル")).rejects.toThrow(
			"ラベル名が重複しています",
		);
	});

	test("updateLabelDescription: 正常にラベル説明文を更新する", async () => {
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

		const result = await updateLabelDescription(1, "更新された説明文");

		expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/labels/1`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ description: "更新された説明文" }),
		});
		expect(result).toEqual(updatedLabel);
	});

	test("updateLabelDescription: 説明文をnullに設定する", async () => {
		const updatedLabel = { id: 1, name: "技術", description: null };
		const mockResponse = { success: true, label: updatedLabel };

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await updateLabelDescription(1, null);

		expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/labels/1`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ description: null }),
		});
		expect(result).toEqual(updatedLabel);
	});

	test("updateLabelDescription: HTTPエラー時に例外を投げる", async () => {
		const errorResponse = { success: false, message: "ラベルが見つかりません" };

		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: () => Promise.resolve(errorResponse),
		});

		await expect(updateLabelDescription(999, "説明文")).rejects.toThrow(
			"ラベルが見つかりません",
		);
	});

	test("deleteLabel: 正常にラベルを削除する", async () => {
		const mockResponse = { success: true, message: "ラベルを削除しました" };

		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const result = await deleteLabel(1);

		expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/labels/1`, {
			method: "DELETE",
		});
		expect(result).toBe("ラベルを削除しました");
	});

	test("deleteLabel: HTTPエラー時に例外を投げる", async () => {
		const errorResponse = { success: false, message: "削除に失敗しました" };

		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: () => Promise.resolve(errorResponse),
		});

		await expect(deleteLabel(1)).rejects.toThrow("削除に失敗しました");
	});

	test("cleanupUnusedLabels: 正常に未使用ラベルを一括削除する", async () => {
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

		const result = await cleanupUnusedLabels();

		expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/api/labels/cleanup`, {
			method: "DELETE",
		});
		expect(result).toEqual({
			message: "Successfully cleaned up 2 unused labels",
			deletedCount: 2,
			deletedLabels,
		});
	});

	test("cleanupUnusedLabels: 削除対象がない場合", async () => {
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

		const result = await cleanupUnusedLabels();

		expect(result.deletedCount).toBe(0);
		expect(result.deletedLabels).toEqual([]);
	});

	test("cleanupUnusedLabels: HTTPエラー時に例外を投げる", async () => {
		const errorResponse = { success: false, message: "クリーンアップに失敗しました" };

		mockFetch.mockResolvedValueOnce({
			ok: false,
			json: () => Promise.resolve(errorResponse),
		});

		await expect(cleanupUnusedLabels()).rejects.toThrow("クリーンアップに失敗しました");
	});
}
