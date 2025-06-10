/**
 * ブックマーク管理機能のビジネスロジックを提供するサービス層
 */

import type { Article } from "../../label/types.js";
import type { Bookmark } from "../types.js";
import * as bookmarkApi from "./bookmarkApiClient.js";

/**
 * IDでブックマークを取得する
 * @param bookmarkId ブックマークID
 * @returns ブックマーク
 */
export async function getBookmarkById(bookmarkId: number): Promise<Bookmark> {
	try {
		return await bookmarkApi.getBookmarkById(bookmarkId);
	} catch (error) {
		console.error("Failed to get bookmark by ID:", error);
		throw new Error(`ブックマークID ${bookmarkId} の取得に失敗しました`);
	}
}

/**
 * ラベル別の未読記事を取得する
 * @param labelName ラベル名
 * @returns 未読記事の配列
 */
export async function getUnreadArticlesByLabel(
	labelName: string,
): Promise<Article[]> {
	try {
		return await bookmarkApi.getUnreadArticlesByLabel(labelName);
	} catch (error) {
		console.error("Failed to get unread articles by label:", error);
		throw new Error(`ラベル "${labelName}" の未読記事の取得に失敗しました`);
	}
}

/**
 * 未読ブックマーク一覧を取得する
 * @returns 未読ブックマークの配列
 */
export async function getUnreadBookmarks(): Promise<Bookmark[]> {
	try {
		return await bookmarkApi.getUnreadBookmarks();
	} catch (error) {
		console.error("Failed to get unread bookmarks:", error);
		throw new Error("未読ブックマーク一覧の取得に失敗しました");
	}
}

/**
 * 既読ブックマーク一覧を取得する
 * @returns 既読ブックマークの配列
 */
export async function getReadBookmarks(): Promise<Bookmark[]> {
	try {
		return await bookmarkApi.getReadBookmarks();
	} catch (error) {
		console.error("Failed to get read bookmarks:", error);
		throw new Error("既読ブックマーク一覧の取得に失敗しました");
	}
}

/**
 * ブックマークを既読にマークする
 * @param bookmarkId ブックマークID
 */
export async function markBookmarkAsRead(bookmarkId: number): Promise<void> {
	try {
		await bookmarkApi.markBookmarkAsRead(bookmarkId);
	} catch (error) {
		console.error("Failed to mark bookmark as read:", error);
		throw new Error(`ブックマークID ${bookmarkId} の既読マークに失敗しました`);
	}
}

/**
 * 未評価の記事を取得する
 * @returns 未評価記事の配列
 */
export async function getUnratedArticles(): Promise<Article[]> {
	try {
		return await bookmarkApi.getUnratedArticles();
	} catch (error) {
		console.error("Failed to get unrated articles:", error);
		throw new Error("未評価記事の取得に失敗しました");
	}
}
