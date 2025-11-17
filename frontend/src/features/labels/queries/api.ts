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
const _fetchLabelById = async (id: number): Promise<Label> => {
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
		throw new Error(errorData.message || "Failed to cleanup unused labels");
	}

	const data: LabelCleanupResponse = await response.json();
	return {
		message: data.message,
		deletedCount: data.deletedCount,
		deletedLabels: data.deletedLabels,
	};
};
