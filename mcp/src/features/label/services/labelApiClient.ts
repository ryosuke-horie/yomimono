/**
 * ラベル管理機能のAPI通信を担当するクライアント
 * 実際のHTTP通信とレスポンスの型検証を行う
 */

import { z } from "zod";
import { getApiBaseUrl } from "../../../lib/api/config.js";
import { ArticleSchema, LabelSchema } from "../types.js";

const apiBaseUrl = getApiBaseUrl();

/**
 * APIレスポンスの共通エラーハンドリング
 */
async function handleApiResponse(response: Response) {
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`API request failed: ${response.status} ${response.statusText} - ${errorText}`,
		);
	}
}

/**
 * ラベルのない記事を取得
 */
export async function getUnlabeledArticles() {
	const response = await fetch(`${apiBaseUrl}/bookmarks/no-labels`);
	await handleApiResponse(response);

	const data = await response.json();
	return z.array(ArticleSchema).parse(data);
}

/**
 * 既存のラベル一覧を取得
 */
export async function getLabels() {
	const response = await fetch(`${apiBaseUrl}/labels`);
	await handleApiResponse(response);

	const data = await response.json();
	return z.array(LabelSchema).parse(data);
}

/**
 * 記事にラベルを割り当て
 */
export async function assignLabelToArticle(
	articleId: number,
	labelName: string,
	description?: string,
) {
	const response = await fetch(`${apiBaseUrl}/labels/assign`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			articleId,
			labelName,
			description,
		}),
	});
	await handleApiResponse(response);
}

/**
 * 新しいラベルを作成
 */
export async function createLabel(labelName: string, description?: string) {
	const response = await fetch(`${apiBaseUrl}/labels`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			name: labelName,
			description,
		}),
	});
	await handleApiResponse(response);

	const data = await response.json();
	return LabelSchema.parse(data);
}

/**
 * IDでラベルを取得
 */
export async function getLabelById(labelId: number) {
	const response = await fetch(`${apiBaseUrl}/labels/${labelId}`);
	await handleApiResponse(response);

	const data = await response.json();
	return LabelSchema.parse(data);
}

/**
 * ラベルを削除
 */
export async function deleteLabel(labelId: number) {
	const response = await fetch(`${apiBaseUrl}/labels/${labelId}`, {
		method: "DELETE",
	});
	await handleApiResponse(response);
}

/**
 * ラベルの説明を更新
 */
export async function updateLabelDescription(
	labelId: number,
	description: string | null,
) {
	const response = await fetch(`${apiBaseUrl}/labels/${labelId}/description`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			description,
		}),
	});
	await handleApiResponse(response);
}

/**
 * 複数の記事に一括でラベルを割り当て
 */
export async function assignLabelsToMultipleArticles(
	articleIds: number[],
	labelName: string,
	description?: string,
) {
	const response = await fetch(`${apiBaseUrl}/labels/assign/batch`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			articleIds,
			labelName,
			description,
		}),
	});
	await handleApiResponse(response);
}
