/**
 * ソート順序の修正検証テスト
 * Issue #721: ラベルフィルタリング時のソート順序問題を修正
 */

import { desc, inArray } from "drizzle-orm";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { articleLabels, bookmarks } from "../db/schema";
import {
	createDrizzleClientMock,
	createDrizzleD1ModuleMock,
} from "../tests/drizzle-mock";
import { DrizzleBookmarkRepository } from "./bookmark";

// モックDBクライアント
const { mockDbClient } = vi.hoisted(() => ({
	mockDbClient: createDrizzleClientMock(),
}));

// Drizzle関数のモック
vi.mock("drizzle-orm/d1", () => createDrizzleD1ModuleMock(mockDbClient));

describe("ソート順序修正の検証", () => {
	let repository: DrizzleBookmarkRepository;

	// テストデータ: 日付順にソートされた複数ラベル付きブックマーク
	const olderBookmark = {
		id: 1,
		url: "https://example.com/older",
		title: "古い記事",
		isRead: false,
		createdAt: new Date("2023-01-01T10:00:00Z"),
		updatedAt: new Date("2023-01-01T10:00:00Z"),
	};

	const newerBookmark = {
		id: 2,
		url: "https://example.com/newer",
		title: "新しい記事",
		isRead: false,
		createdAt: new Date("2023-01-02T10:00:00Z"),
		updatedAt: new Date("2023-01-02T10:00:00Z"),
	};

	const testLabel = {
		id: 1,
		name: "typescript",
		description: "TypeScript関連記事",
		createdAt: new Date(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		repository = new DrizzleBookmarkRepository({} as D1Database);
	});

	describe("findUnread() - 修正後のソート順序", () => {
		it("複数ラベル付きブックマークでも重複なく正しい順序で取得できること", async () => {
			// Step 1: ブックマークとお気に入り情報を取得（重複なし）
			mockDbClient.all
				.mockResolvedValueOnce([
					// 正しい順序: 新しい順（DESC）
					{ bookmark: newerBookmark, favorite: null },
					{ bookmark: olderBookmark, favorite: null },
				])
				// Step 2: ラベル情報を取得
				.mockResolvedValueOnce([
					{ articleId: 1, label: testLabel },
					{ articleId: 2, label: testLabel },
				]);

			const result = await repository.findUnread();

			// 結果の検証
			expect(result).toHaveLength(2);
			expect(result[0].id).toBe(2); // 新しい記事が最初
			expect(result[1].id).toBe(1); // 古い記事が2番目
			expect(result[0].label?.name).toBe("typescript");
			expect(result[1].label?.name).toBe("typescript");

			// クエリ呼び出しの検証
			expect(mockDbClient.select).toHaveBeenCalledTimes(2);
			expect(mockDbClient.orderBy).toHaveBeenCalledWith(
				desc(bookmarks.createdAt),
			);
		});

		it("ラベルのないブックマークも正しく処理できること", async () => {
			// Step 1: ブックマーク取得
			mockDbClient.all
				.mockResolvedValueOnce([
					{ bookmark: newerBookmark, favorite: null },
					{ bookmark: olderBookmark, favorite: null },
				])
				// Step 2: ラベル情報なし
				.mockResolvedValueOnce([]);

			const result = await repository.findUnread();

			expect(result).toHaveLength(2);
			expect(result[0].id).toBe(2);
			expect(result[1].id).toBe(1);
			expect(result[0].label).toBeNull();
			expect(result[1].label).toBeNull();
		});

		it("空の結果でも適切に処理できること", async () => {
			mockDbClient.all.mockResolvedValueOnce([]);

			const result = await repository.findUnread();

			expect(result).toHaveLength(0);
			// 2回目のクエリは実行されない（早期リターン）
			expect(mockDbClient.all).toHaveBeenCalledTimes(1);
		});
	});

	describe("findByLabelName() との一貫性", () => {
		it("両メソッドが同じソート順序を使用していること", async () => {
			// findUnread用のモック
			mockDbClient.all
				.mockResolvedValueOnce([
					{ bookmark: newerBookmark, favorite: null },
					{ bookmark: olderBookmark, favorite: null },
				])
				.mockResolvedValueOnce([
					{ articleId: 1, label: testLabel },
					{ articleId: 2, label: testLabel },
				]);

			await repository.findUnread();

			// findByLabelName用のモック
			mockDbClient.all.mockResolvedValueOnce([
				{
					bookmark: newerBookmark,
					favorite: null,
					label: testLabel,
				},
				{
					bookmark: olderBookmark,
					favorite: null,
					label: testLabel,
				},
			]);

			await repository.findByLabelName("typescript");

			// 両方のメソッドで同じorderByが使用されていることを確認
			expect(mockDbClient.orderBy).toHaveBeenCalledWith(
				desc(bookmarks.createdAt),
			);
			expect(mockDbClient.orderBy).toHaveBeenCalledTimes(2);
		});
	});

	describe("パフォーマンス最適化の検証", () => {
		it("2段階クエリでも効率的に実行されること", async () => {
			const bookmarkIds = [1, 2, 3];

			// Step 1のモック
			mockDbClient.all.mockResolvedValueOnce(
				bookmarkIds.map((id) => ({
					bookmark: { ...olderBookmark, id },
					favorite: null,
				})),
			);

			// Step 2のモック
			mockDbClient.all.mockResolvedValueOnce(
				bookmarkIds.map((id) => ({
					articleId: id,
					label: testLabel,
				})),
			);

			await repository.findUnread();

			// Step 2でinArray()が正しく使用されていることを確認
			expect(mockDbClient.where).toHaveBeenCalledWith(
				inArray(articleLabels.articleId, bookmarkIds),
			);
		});
	});
});
