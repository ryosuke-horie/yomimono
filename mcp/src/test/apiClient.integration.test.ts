/**
 * MCPサーバーのラベル関連機能の統合テスト
 * モックAPIサーバーとの連携をシミュレート
 */
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { MockInstance } from "vitest";
import * as apiClient from "../lib/apiClient.js";

describe("Label API Integration Tests", () => {
	let fetchMock: MockInstance;
	const originalEnv = process.env.API_BASE_URL;

	// モックデータストア（実際のAPIの動作をシミュレート）
	let mockLabels: Map<
		number,
		{
			id: number;
			name: string;
			description: string | null;
			createdAt: string;
			updatedAt: string;
		}
	>;
	let mockArticles: Map<
		number,
		{
			id: number;
			title: string;
			url: string;
			isRead: boolean;
			labelId: number | null;
			createdAt: string;
			updatedAt: string;
		}
	>;
	let nextLabelId: number;
	let nextArticleId: number;

	beforeEach(() => {
		// 環境変数をモック
		process.env.API_BASE_URL = "http://localhost:3000";

		// モックデータの初期化
		mockLabels = new Map();
		mockArticles = new Map();
		nextLabelId = 1;
		nextArticleId = 1;

		// 初期データを追加
		const initialArticles = [
			{
				id: nextArticleId++,
				title: "Article 1",
				url: "https://example.com/1",
				isRead: false,
				labelId: null,
				createdAt: "2024-01-01T00:00:00Z",
				updatedAt: "2024-01-01T00:00:00Z",
			},
			{
				id: nextArticleId++,
				title: "Article 2",
				url: "https://example.com/2",
				isRead: false,
				labelId: null,
				createdAt: "2024-01-02T00:00:00Z",
				updatedAt: "2024-01-02T00:00:00Z",
			},
			{
				id: nextArticleId++,
				title: "Article 3",
				url: "https://example.com/3",
				isRead: true,
				labelId: null,
				createdAt: "2024-01-03T00:00:00Z",
				updatedAt: "2024-01-03T00:00:00Z",
			},
		];

		initialArticles.forEach((article) => {
			mockArticles.set(article.id, article);
		});

		// fetchをモック化して実際のAPIの動作をシミュレート
		fetchMock = vi.spyOn(global, "fetch");
		fetchMock.mockImplementation(async (url: string, options?: RequestInit) => {
			const urlStr = url.toString();
			const method = options?.method || "GET";

			// ラベル一覧取得
			if (urlStr.endsWith("/api/labels") && method === "GET") {
				return {
					ok: true,
					json: async () => ({
						success: true,
						labels: Array.from(mockLabels.values()),
					}),
				} as Response;
			}

			// ラベル作成
			if (urlStr.endsWith("/api/labels") && method === "POST") {
				const body = JSON.parse(options?.body as string);
				const existingLabel = Array.from(mockLabels.values()).find(
					(l) => l.name === body.name,
				);

				if (existingLabel) {
					return {
						ok: false,
						status: 409,
						statusText: "Conflict",
						headers: new Headers({ "content-type": "application/json" }),
						json: async () => ({
							message: "Label already exists",
						}),
					} as Response;
				}

				const newLabel = {
					id: nextLabelId++,
					name: body.name,
					description: body.description || null,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
				mockLabels.set(newLabel.id, newLabel);

				return {
					ok: true,
					headers: new Headers({ "content-type": "application/json" }),
					json: async () => ({
						success: true,
						label: newLabel,
					}),
				} as Response;
			}

			// ラベル取得（ID指定）
			const labelByIdMatch = urlStr.match(/\/api\/labels\/(\d+)$/);
			if (labelByIdMatch && method === "GET") {
				const labelId = Number.parseInt(labelByIdMatch[1]);
				const label = mockLabels.get(labelId);

				if (!label) {
					return {
						ok: false,
						statusText: "Not Found",
					} as Response;
				}

				return {
					ok: true,
					json: async () => ({
						success: true,
						label,
					}),
				} as Response;
			}

			// ラベル更新（説明のみ）
			if (labelByIdMatch && method === "PATCH") {
				const labelId = Number.parseInt(labelByIdMatch[1]);
				const label = mockLabels.get(labelId);

				if (!label) {
					return {
						ok: false,
						statusText: "Not Found",
					} as Response;
				}

				const body = JSON.parse(options?.body as string);
				label.description = body.description;
				label.updatedAt = new Date().toISOString();

				return {
					ok: true,
					json: async () => ({
						success: true,
						label,
					}),
				} as Response;
			}

			// ラベル削除
			if (labelByIdMatch && method === "DELETE") {
				const labelId = Number.parseInt(labelByIdMatch[1]);
				const label = mockLabels.get(labelId);

				if (!label) {
					return {
						ok: false,
						status: 404,
						statusText: "Not Found",
						json: async () => ({
							message: "Label not found",
						}),
					} as Response;
				}

				// 使用中のラベルかチェック
				const isInUse = Array.from(mockArticles.values()).some(
					(a) => a.labelId === labelId,
				);
				if (isInUse) {
					return {
						ok: false,
						status: 409,
						statusText: "Conflict",
						json: async () => ({
							message: "Cannot delete label: still in use",
						}),
					} as Response;
				}

				mockLabels.delete(labelId);

				return {
					ok: true,
					json: async () => ({
						success: true,
						message: "Label deleted successfully",
					}),
				} as Response;
			}

			// 未ラベル記事取得
			if (urlStr.endsWith("/api/bookmarks/unlabeled") && method === "GET") {
				const unlabeledArticles = Array.from(mockArticles.values())
					.filter((a) => a.labelId === null)
					.map(({ labelId, ...article }) => article); // labelIdを除外

				return {
					ok: true,
					json: async () => ({
						success: true,
						bookmarks: unlabeledArticles,
					}),
				} as Response;
			}

			// 記事にラベル割り当て
			const assignLabelMatch = urlStr.match(/\/api\/bookmarks\/(\d+)\/label$/);
			if (assignLabelMatch && method === "PUT") {
				const articleId = Number.parseInt(assignLabelMatch[1]);
				const article = mockArticles.get(articleId);

				if (!article) {
					return {
						ok: false,
						statusText: "Not Found",
					} as Response;
				}

				const body = JSON.parse(options?.body as string);
				let label = Array.from(mockLabels.values()).find(
					(l) => l.name === body.labelName,
				);

				// ラベルが存在しない場合は作成
				if (!label) {
					label = {
						id: nextLabelId++,
						name: body.labelName,
						description: body.description || null,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};
					mockLabels.set(label.id, label);
				}

				article.labelId = label.id;
				article.updatedAt = new Date().toISOString();

				return {
					ok: true,
					json: async () => ({ success: true }),
				} as Response;
			}

			// 複数記事へのラベル一括割り当て
			if (urlStr.endsWith("/api/bookmarks/batch-label") && method === "PUT") {
				const body = JSON.parse(options?.body as string);
				const { articleIds, labelName, description } = body;

				// ラベルを取得または作成
				let label = Array.from(mockLabels.values()).find(
					(l) => l.name === labelName,
				);

				if (!label) {
					label = {
						id: nextLabelId++,
						name: labelName,
						description: description || null,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};
					mockLabels.set(label.id, label);
				}

				let successful = 0;
				let skipped = 0;
				const errors: Array<{ articleId: number; error: string }> = [];

				for (const articleId of articleIds) {
					const article = mockArticles.get(articleId);

					if (!article) {
						errors.push({
							articleId,
							error: "Article not found",
						});
					} else if (article.labelId === label.id) {
						skipped++;
					} else {
						article.labelId = label.id;
						article.updatedAt = new Date().toISOString();
						successful++;
					}
				}

				return {
					ok: true,
					json: async () => ({
						success: true,
						successful,
						skipped,
						errors,
						label,
					}),
				} as Response;
			}

			// デフォルトのレスポンス
			return {
				ok: false,
				statusText: "Not Found",
				json: async () => ({ message: "Endpoint not found" }),
			} as Response;
		});
	});

	afterEach(() => {
		// 環境変数を復元
		if (originalEnv) {
			process.env.API_BASE_URL = originalEnv;
		} else {
			delete process.env.API_BASE_URL;
		}
		// モックをリセット
		vi.restoreAllMocks();
	});

	describe("ラベル作成と記事への割り当てフロー", () => {
		test("新規ラベルを作成して記事に割り当てるワークフロー", async () => {
			// 1. 初期状態：ラベルが存在しない
			const initialLabels = await apiClient.getLabels();
			expect(initialLabels).toEqual([]);

			// 2. 未ラベル記事を取得
			const unlabeledArticles = await apiClient.getUnlabeledArticles();
			expect(unlabeledArticles.length).toBeGreaterThan(0);

			// 3. 新しいラベルを作成
			const newLabel = await apiClient.createLabel(
				"技術記事",
				"技術関連の記事",
			);
			expect(newLabel.name).toBe("技術記事");
			expect(newLabel.id).toBeDefined();

			// 4. 作成したラベルが一覧に含まれることを確認
			const labelsAfterCreate = await apiClient.getLabels();
			expect(labelsAfterCreate).toHaveLength(1);
			expect(labelsAfterCreate[0].name).toBe("技術記事");

			// 5. 記事にラベルを割り当て
			await apiClient.assignLabelToArticle(
				unlabeledArticles[0].id,
				"技術記事",
			);

			// 6. 未ラベル記事が減っていることを確認
			const unlabeledAfterAssign = await apiClient.getUnlabeledArticles();
			expect(unlabeledAfterAssign.length).toBe(unlabeledArticles.length - 1);
		});

		test("複数の記事に一括でラベルを割り当てるワークフロー", async () => {
			// 1. 未ラベル記事を取得
			const unlabeledArticles = await apiClient.getUnlabeledArticles();
			const articleIds = unlabeledArticles.map((a) => a.id);

			// 2. 複数記事に一括でラベルを割り当て（ラベルは自動作成される）
			const result = await apiClient.assignLabelsToMultipleArticles(
				articleIds,
				"一括ラベル",
				"一括で割り当てたラベル",
			);

			expect(result.successful).toBe(articleIds.length);
			expect(result.skipped).toBe(0);
			expect(result.errors).toEqual([]);
			expect(result.label.name).toBe("一括ラベル");

			// 3. すべての記事がラベル付けされたことを確認
			const unlabeledAfter = await apiClient.getUnlabeledArticles();
			expect(unlabeledAfter).toEqual([]);
		});

		test("既存のラベルに記事を追加するワークフロー", async () => {
			// 1. ラベルを作成
			const label = await apiClient.createLabel("既存ラベル");

			// 2. 最初の記事にラベルを割り当て
			const articles = await apiClient.getUnlabeledArticles();
			await apiClient.assignLabelToArticle(articles[0].id, "既存ラベル");

			// 3. 別の記事に同じラベルを割り当て
			await apiClient.assignLabelToArticle(articles[1].id, "既存ラベル");

			// 4. ラベルの数が増えていないことを確認（既存のラベルを使用）
			const labels = await apiClient.getLabels();
			expect(labels).toHaveLength(1);
			expect(labels[0].name).toBe("既存ラベル");
		});
	});

	describe("エラーケースの統合テスト", () => {
		test("重複するラベル名での作成がエラーになること", async () => {
			// 1. 最初のラベルを作成
			await apiClient.createLabel("重複ラベル", "最初の説明");

			// 2. 同じ名前で再度作成を試みる
			await expect(
				apiClient.createLabel("重複ラベル", "別の説明"),
			).rejects.toThrow("Label already exists");

			// 3. ラベルは1つだけ存在することを確認
			const labels = await apiClient.getLabels();
			expect(labels).toHaveLength(1);
		});

		test("存在しない記事へのラベル割り当てがエラーになること", async () => {
			await expect(
				apiClient.assignLabelToArticle(999, "テストラベル"),
			).rejects.toThrow("Failed to assign label");
		});

		test("使用中のラベルの削除がエラーになること", async () => {
			// 1. ラベルを作成
			const label = await apiClient.createLabel("使用中ラベル");

			// 2. 記事にラベルを割り当て
			const articles = await apiClient.getUnlabeledArticles();
			await apiClient.assignLabelToArticle(articles[0].id, "使用中ラベル");

			// 3. ラベルの削除を試みる（失敗するはず）
			await expect(apiClient.deleteLabel(label.id)).rejects.toThrow(
				"Cannot delete label: still in use",
			);
		});

		test("複数記事への一括割り当てで一部が失敗するケース", async () => {
			const validIds = [1, 2];
			const invalidIds = [999, 1000];
			const mixedIds = [...validIds, ...invalidIds];

			const result = await apiClient.assignLabelsToMultipleArticles(
				mixedIds,
				"混在ラベル",
			);

			expect(result.successful).toBe(2);
			expect(result.skipped).toBe(0);
			expect(result.errors).toHaveLength(2);
			expect(result.errors[0].articleId).toBe(999);
			expect(result.errors[0].error).toBe("Article not found");
		});
	});

	describe("ラベルの更新と削除のフロー", () => {
		test("ラベルの説明を更新するワークフロー", async () => {
			// 1. ラベルを作成
			const label = await apiClient.createLabel("更新テスト", "初期説明");

			// 2. ラベルの説明を更新
			const updated = await apiClient.updateLabelDescription(
				label.id,
				"更新された説明",
			);
			expect(updated.description).toBe("更新された説明");

			// 3. 更新が永続化されていることを確認
			const fetched = await apiClient.getLabelById(label.id);
			expect(fetched.description).toBe("更新された説明");

			// 4. 説明をnullに設定
			const nullified = await apiClient.updateLabelDescription(label.id, null);
			expect(nullified.description).toBeNull();
		});

		test("未使用ラベルを削除するワークフロー", async () => {
			// 1. 複数のラベルを作成
			const label1 = await apiClient.createLabel("削除対象1");
			const label2 = await apiClient.createLabel("削除対象2");

			// 2. ラベルが存在することを確認
			const labelsBeforeDelete = await apiClient.getLabels();
			expect(labelsBeforeDelete).toHaveLength(2);

			// 3. 一つ目のラベルを削除
			await apiClient.deleteLabel(label1.id);

			// 4. ラベルが削除されたことを確認
			const labelsAfterDelete = await apiClient.getLabels();
			expect(labelsAfterDelete).toHaveLength(1);
			expect(labelsAfterDelete[0].id).toBe(label2.id);

			// 5. 削除されたラベルの取得がエラーになることを確認
			await expect(apiClient.getLabelById(label1.id)).rejects.toThrow(
				"Failed to fetch label",
			);
		});
	});

	describe("重複処理の防止", () => {
		test("同じ記事に同じラベルを再度割り当てた場合スキップされること", async () => {
			const articles = await apiClient.getUnlabeledArticles();
			const articleId = articles[0].id;

			// 1. 最初の割り当て
			await apiClient.assignLabelToArticle(articleId, "重複テスト");

			// 2. 同じ記事に同じラベルを一括割り当て
			const result = await apiClient.assignLabelsToMultipleArticles(
				[articleId],
				"重複テスト",
			);

			expect(result.successful).toBe(0);
			expect(result.skipped).toBe(1);
			expect(result.errors).toEqual([]);
		});

		test("複数回の一括割り当てで適切にスキップされること", async () => {
			const articles = await apiClient.getUnlabeledArticles();
			const articleIds = articles.map((a) => a.id);

			// 1. 最初の一括割り当て
			const firstResult = await apiClient.assignLabelsToMultipleArticles(
				articleIds,
				"一括テスト",
			);
			expect(firstResult.successful).toBe(articleIds.length);

			// 2. 同じ記事に再度一括割り当て
			const secondResult = await apiClient.assignLabelsToMultipleArticles(
				articleIds,
				"一括テスト",
			);
			expect(secondResult.successful).toBe(0);
			expect(secondResult.skipped).toBe(articleIds.length);
		});
	});
});

describe("Concurrent Operations", () => {
	let fetchMock: MockInstance;

	beforeEach(() => {
		process.env.API_BASE_URL = "http://localhost:3000";
		fetchMock = vi.spyOn(global, "fetch");
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("複数の並行リクエストが正しく処理されること", async () => {
		let callCount = 0;
		fetchMock.mockImplementation(async () => {
			callCount++;
			// 各リクエストに異なる遅延を設定
			await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));

			return {
				ok: true,
				json: async () => ({
					success: true,
					labels: [{ id: callCount, name: `Label${callCount}` }],
				}),
			} as Response;
		});

		// 並行して複数のリクエストを送信
		const promises = [
			apiClient.getLabels(),
			apiClient.getLabels(),
			apiClient.getLabels(),
		];

		const results = await Promise.all(promises);

		// すべてのリクエストが処理されたことを確認
		expect(callCount).toBe(3);
		expect(results).toHaveLength(3);
	});
});