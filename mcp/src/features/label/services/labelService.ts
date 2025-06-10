/**
 * ラベル管理機能のビジネスロジックを提供するサービス層
 * APIクライアントをラップし、エラーハンドリングやデータ変換を行う
 */

import type { Label } from "../types.js";
import * as labelApi from "./labelApiClient.js";

/**
 * ラベルのない記事を取得する
 * @returns ラベルのない記事の配列
 */
export async function getUnlabeledArticles() {
	try {
		return await labelApi.getUnlabeledArticles();
	} catch (error) {
		console.error("Failed to get unlabeled articles:", error);
		throw new Error("ラベルのない記事の取得に失敗しました");
	}
}

/**
 * 既存のラベル一覧を取得する
 * @returns ラベルの配列
 */
export async function getLabels(): Promise<Label[]> {
	try {
		return await labelApi.getLabels();
	} catch (error) {
		console.error("Failed to get labels:", error);
		throw new Error("ラベル一覧の取得に失敗しました");
	}
}

/**
 * 記事にラベルを割り当てる
 * @param articleId 記事ID
 * @param labelName ラベル名
 * @param description 説明（オプション）
 */
export async function assignLabelToArticle(
	articleId: number,
	labelName: string,
	description?: string,
) {
	try {
		await labelApi.assignLabelToArticle(articleId, labelName, description);
	} catch (error) {
		console.error("Failed to assign label:", error);
		throw new Error(`記事ID ${articleId} へのラベル割り当てに失敗しました`);
	}
}

/**
 * 新しいラベルを作成する
 * @param labelName ラベル名
 * @param description 説明（オプション）
 * @returns 作成されたラベル
 */
export async function createLabel(
	labelName: string,
	description?: string,
): Promise<Label> {
	try {
		return await labelApi.createLabel(labelName, description);
	} catch (error) {
		console.error("Failed to create label:", error);
		throw new Error(`ラベル "${labelName}" の作成に失敗しました`);
	}
}

/**
 * IDでラベルを取得する
 * @param labelId ラベルID
 * @returns ラベル
 */
export async function getLabelById(labelId: number): Promise<Label> {
	try {
		return await labelApi.getLabelById(labelId);
	} catch (error) {
		console.error("Failed to get label by ID:", error);
		throw new Error(`ラベルID ${labelId} の取得に失敗しました`);
	}
}

/**
 * ラベルを削除する
 * @param labelId ラベルID
 */
export async function deleteLabel(labelId: number) {
	try {
		await labelApi.deleteLabel(labelId);
	} catch (error) {
		console.error("Failed to delete label:", error);
		throw new Error(`ラベルID ${labelId} の削除に失敗しました`);
	}
}

/**
 * ラベルの説明を更新する
 * @param labelId ラベルID
 * @param description 新しい説明
 */
export async function updateLabelDescription(
	labelId: number,
	description: string | null,
) {
	try {
		await labelApi.updateLabelDescription(labelId, description);
	} catch (error) {
		console.error("Failed to update label description:", error);
		throw new Error(`ラベルID ${labelId} の説明更新に失敗しました`);
	}
}

/**
 * 複数の記事に一括でラベルを割り当てる
 * @param articleIds 記事IDの配列
 * @param labelName ラベル名
 * @param description 説明（オプション）
 */
export async function assignLabelsToMultipleArticles(
	articleIds: number[],
	labelName: string,
	description?: string,
) {
	try {
		await labelApi.assignLabelsToMultipleArticles(
			articleIds,
			labelName,
			description,
		);
	} catch (error) {
		console.error("Failed to assign labels to multiple articles:", error);
		throw new Error("複数記事へのラベル割り当てに失敗しました");
	}
}
