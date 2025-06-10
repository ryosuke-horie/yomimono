/**
 * ブックマーク管理機能のAPI通信を担当するクライアント
 */

import { z } from "zod";
import { getApiBaseUrl } from "../../../lib/api/config.js";
import { ArticleSchema } from "../../label/types.js";
import { BookmarkSchema } from "../types.js";

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
 * IDでブックマークを取得
 */
export async function getBookmarkById(bookmarkId: number) {
	const response = await fetch(`${apiBaseUrl}/bookmarks/${bookmarkId}`);
	await handleApiResponse(response);

	const data = await response.json();
	return BookmarkSchema.parse(data);
}

/**
 * ラベル別の未読記事を取得
 */
export async function getUnreadArticlesByLabel(labelName: string) {
	const encodedLabel = encodeURIComponent(labelName);
	const response = await fetch(
		`${apiBaseUrl}/bookmarks/unread/label/${encodedLabel}`,
	);
	await handleApiResponse(response);

	const data = await response.json();
	return z.array(ArticleSchema).parse(data);
}

/**
 * 未読ブックマーク一覧を取得
 */
export async function getUnreadBookmarks() {
	const response = await fetch(`${apiBaseUrl}/bookmarks/unread`);
	await handleApiResponse(response);

	const data = await response.json();
	return z.array(BookmarkSchema).parse(data);
}

/**
 * 既読ブックマーク一覧を取得
 */
export async function getReadBookmarks() {
	const response = await fetch(`${apiBaseUrl}/bookmarks/read`);
	await handleApiResponse(response);

	const data = await response.json();
	return z.array(BookmarkSchema).parse(data);
}

/**
 * ブックマークを既読にマーク
 */
export async function markBookmarkAsRead(bookmarkId: number) {
	const response = await fetch(
		`${apiBaseUrl}/bookmarks/${bookmarkId}/mark-read`,
		{
			method: "POST",
		},
	);
	await handleApiResponse(response);
}

/**
 * 未評価の記事を取得
 */
export async function getUnratedArticles() {
	const response = await fetch(`${apiBaseUrl}/bookmarks/unrated`);
	await handleApiResponse(response);

	const data = await response.json();
	return z.array(ArticleSchema).parse(data);
}
