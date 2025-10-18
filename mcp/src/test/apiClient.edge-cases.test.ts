/**
 * MCPサーバーのエッジケースと境界値テスト
 */

import type { MockInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as apiClient from "../lib/apiClient.js";

describe("Edge Cases and Boundary Value Tests", () => {
	let fetchMock: MockInstance;
	const originalEnv = process.env.API_BASE_URL;

	beforeEach(() => {
		process.env.API_BASE_URL = "http://localhost:3000";
		fetchMock = vi.spyOn(global, "fetch");
	});

	afterEach(() => {
		if (originalEnv) {
			process.env.API_BASE_URL = originalEnv;
		} else {
			delete process.env.API_BASE_URL;
		}
		vi.restoreAllMocks();
	});

	describe("assignLabelsToMultipleArticles - 境界値とエッジケース", () => {
		test("非常に大きな記事ID配列を処理できること", async () => {
			// 1000個の記事IDを生成
			const largeArticleIds = Array.from({ length: 1000 }, (_, i) => i + 1);

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					successful: 900,
					skipped: 50,
					errors: Array.from({ length: 50 }, (_, i) => ({
						articleId: i + 951,
						error: "Article not found",
					})),
					label: {
						id: 1,
						name: "大量処理",
						description: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			const result = await apiClient.assignLabelsToMultipleArticles(largeArticleIds, "大量処理");

			expect(result.successful).toBe(900);
			expect(result.skipped).toBe(50);
			expect(result.errors).toHaveLength(50);
		});

		test("単一要素の配列を正しく処理できること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					successful: 1,
					skipped: 0,
					errors: [],
					label: {
						id: 1,
						name: "単一",
						description: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			const result = await apiClient.assignLabelsToMultipleArticles([42], "単一");

			expect(result.successful).toBe(1);
			expect(result.errors).toEqual([]);
		});

		test("すべての記事が既にラベル付けされている場合", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					successful: 0,
					skipped: 5,
					errors: [],
					label: {
						id: 1,
						name: "既存",
						description: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			const result = await apiClient.assignLabelsToMultipleArticles([1, 2, 3, 4, 5], "既存");

			expect(result.successful).toBe(0);
			expect(result.skipped).toBe(5);
		});

		test("すべての記事IDが無効な場合", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					successful: 0,
					skipped: 0,
					errors: [
						{ articleId: -1, error: "Invalid article ID" },
						{ articleId: -2, error: "Invalid article ID" },
						{ articleId: 0, error: "Invalid article ID" },
					],
					label: {
						id: 1,
						name: "無効",
						description: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			const result = await apiClient.assignLabelsToMultipleArticles([-1, -2, 0], "無効");

			expect(result.successful).toBe(0);
			expect(result.errors).toHaveLength(3);
		});
	});

	describe("ラベル名の特殊ケース", () => {
		test("非常に長いラベル名を処理できること", async () => {
			const longLabelName = "あ".repeat(255); // 255文字のラベル名

			fetchMock.mockResolvedValueOnce({
				ok: true,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					success: true,
					label: {
						id: 1,
						name: longLabelName,
						description: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			const result = await apiClient.createLabel(longLabelName);
			expect(result.name).toBe(longLabelName);
		});

		test("特殊文字を含むラベル名を処理できること", async () => {
			const specialChars = [
				"テスト#1",
				"テスト@2",
				"テスト$3",
				"テスト%4",
				"テスト&5",
				"テスト*6",
				"テスト(7)",
				"テスト[8]",
				"テスト{9}",
				'テスト"10"',
				"テスト'11'",
				"テスト<12>",
				"テスト=13",
				"テスト+14",
				"テスト-15",
				"テスト_16",
				"テスト.17",
				"テスト,18",
				"テスト;19",
				"テスト:20",
				"テスト/21",
				"テスト\\22",
				"テスト|23",
				"テスト?24",
				"テスト!25",
				"テスト~26",
				"テスト`27",
				"テスト^28",
				"テスト 空白 29",
				"テスト\tタブ30",
				"テスト\n改行31",
			];

			for (const labelName of specialChars) {
				fetchMock.mockResolvedValueOnce({
					ok: true,
					headers: new Headers({ "content-type": "application/json" }),
					json: async () => ({
						success: true,
						label: {
							id: 1,
							name: labelName,
							description: null,
							createdAt: "2024-01-01T00:00:00Z",
							updatedAt: "2024-01-01T00:00:00Z",
						},
					}),
				} as Response);

				const result = await apiClient.createLabel(labelName);
				expect(result.name).toBe(labelName);
			}
		});

		test("絵文字を含むラベル名を処理できること", async () => {
			const emojiLabels = [
				"📚 読書",
				"🔧 技術",
				"📰 ニュース",
				"🎯 重要",
				"⭐ お気に入り",
				"🚀 新機能",
				"🐛 バグ",
				"💡 アイデア",
				"🌟✨💫 複数絵文字",
			];

			for (const labelName of emojiLabels) {
				fetchMock.mockResolvedValueOnce({
					ok: true,
					headers: new Headers({ "content-type": "application/json" }),
					json: async () => ({
						success: true,
						label: {
							id: 1,
							name: labelName,
							description: null,
							createdAt: "2024-01-01T00:00:00Z",
							updatedAt: "2024-01-01T00:00:00Z",
						},
					}),
				} as Response);

				const result = await apiClient.createLabel(labelName);
				expect(result.name).toBe(labelName);
			}
		});

		test("Unicode文字を含むラベル名を処理できること", async () => {
			const unicodeLabels = [
				"中文标签", // 中国語
				"한글라벨", // 韓国語
				"العربية", // アラビア語
				"ไทย", // タイ語
				"עברית", // ヘブライ語
				"Ελληνικά", // ギリシャ語
				"Русский", // ロシア語
				"日本語ラベル", // 日本語
			];

			for (const labelName of unicodeLabels) {
				fetchMock.mockResolvedValueOnce({
					ok: true,
					headers: new Headers({ "content-type": "application/json" }),
					json: async () => ({
						success: true,
						label: {
							id: 1,
							name: labelName,
							description: null,
							createdAt: "2024-01-01T00:00:00Z",
							updatedAt: "2024-01-01T00:00:00Z",
						},
					}),
				} as Response);

				const result = await apiClient.createLabel(labelName);
				expect(result.name).toBe(labelName);
			}
		});
	});

	describe("説明フィールドの境界値", () => {
		test("非常に長い説明を処理できること", async () => {
			const longDescription = "説明".repeat(2000); // 4000文字の説明

			fetchMock.mockResolvedValueOnce({
				ok: true,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					success: true,
					label: {
						id: 1,
						name: "テスト",
						description: longDescription,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			const result = await apiClient.createLabel("テスト", longDescription);
			expect(result.description).toBe(longDescription);
		});

		test("空文字列の説明を処理できること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					success: true,
					label: {
						id: 1,
						name: "テスト",
						description: "",
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			const result = await apiClient.createLabel("テスト", "");
			expect(result.description).toBe("");
		});

		test("スペースのみの説明を処理できること", async () => {
			const spacesOnly = "   ";

			fetchMock.mockResolvedValueOnce({
				ok: true,
				headers: new Headers({ "content-type": "application/json" }),
				json: async () => ({
					success: true,
					label: {
						id: 1,
						name: "テスト",
						description: spacesOnly,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			const result = await apiClient.createLabel("テスト", spacesOnly);
			expect(result.description).toBe(spacesOnly);
		});
	});

	describe("数値境界値のテスト", () => {
		test("最大整数値のIDを処理できること", async () => {
			const maxId = Number.MAX_SAFE_INTEGER;

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					label: {
						id: maxId,
						name: "最大ID",
						description: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			const result = await apiClient.getLabelById(maxId);
			expect(result.id).toBe(maxId);
		});

		test("ゼロのIDを処理できること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					label: {
						id: 0,
						name: "ゼロID",
						description: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			const result = await apiClient.getLabelById(0);
			expect(result.id).toBe(0);
		});

		test("負のIDでもAPIリクエストは送信されること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: false,
				statusText: "Bad Request",
			} as Response);

			await expect(apiClient.getLabelById(-1)).rejects.toThrow("Failed to fetch label with ID -1: Bad Request");

			expect(fetchMock).toHaveBeenCalledWith("http://localhost:3000/api/labels/-1");
		});
	});

	describe("日付フィールドの処理", () => {
		test("様々な日付形式を処理できること", async () => {
			const dateFormats = [
				"2024-01-01T00:00:00Z",
				"2024-01-01T00:00:00.000Z",
				"2024-01-01T00:00:00+09:00",
				"2024-01-01T00:00:00-05:00",
				"2024-12-31T23:59:59Z",
			];

			for (const dateFormat of dateFormats) {
				fetchMock.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						success: true,
						labels: [
							{
								id: 1,
								name: "テスト",
								description: null,
								createdAt: dateFormat,
								updatedAt: dateFormat,
							},
						],
					}),
				} as Response);

				const result = await apiClient.getLabels();
				expect(result[0].createdAt).toBe(dateFormat);
				expect(result[0].updatedAt).toBe(dateFormat);
			}
		});

		test("Dateオブジェクトとして返される日付を処理できること", async () => {
			const now = new Date();

			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					labels: [
						{
							id: 1,
							name: "テスト",
							description: null,
							createdAt: now,
							updatedAt: now,
						},
					],
				}),
			} as Response);

			const result = await apiClient.getLabels();
			expect(result[0].createdAt).toEqual(now);
			expect(result[0].updatedAt).toEqual(now);
		});
	});

	describe("レスポンスの異常パターン", () => {
		test("予期しない追加フィールドがあっても処理できること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					labels: [
						{
							id: 1,
							name: "テスト",
							description: null,
							createdAt: "2024-01-01T00:00:00Z",
							updatedAt: "2024-01-01T00:00:00Z",
							unexpectedField: "予期しない値",
							anotherField: 12345,
						},
					],
					extraData: "追加データ",
				}),
			} as Response);

			const result = await apiClient.getLabels();
			expect(result[0].id).toBe(1);
			expect(result[0].name).toBe("テスト");
			// 追加フィールドは無視される
		});

		test("部分的に不正なデータが含まれる配列を処理できること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					successful: 2,
					skipped: 1,
					errors: [
						{ articleId: "文字列ID", error: "Invalid ID" }, // 本来はnumberであるべき
						{ articleId: 2, error: "Valid error" },
						{ articleId: null, error: "Null ID" }, // nullのID
					],
					label: {
						id: 1,
						name: "テスト",
						description: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			// Zodバリデーションでエラーになるはず
			await expect(apiClient.assignLabelsToMultipleArticles([1, 2, 3], "テスト")).rejects.toThrow(
				"Invalid API response",
			);
		});
	});

	describe("ネットワークエラーと再試行", () => {
		test("ネットワークタイムアウトを適切に処理すること", async () => {
			fetchMock.mockImplementation(
				() =>
					new Promise((_, reject) => {
						setTimeout(() => reject(new Error("Network timeout")), 100);
					}),
			);

			await expect(apiClient.getLabels()).rejects.toThrow("Network timeout");
		});

		test("接続拒否エラーを適切に処理すること", async () => {
			fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

			await expect(apiClient.getUnlabeledArticles()).rejects.toThrow("ECONNREFUSED");
		});

		test("DNSエラーを適切に処理すること", async () => {
			fetchMock.mockRejectedValueOnce(new Error("ENOTFOUND"));

			await expect(apiClient.createLabel("test")).rejects.toThrow("ENOTFOUND");
		});
	});

	describe("Content-Typeの処理", () => {
		test("Content-Typeがない場合でも処理できること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				headers: new Headers(), // Content-Typeなし
				json: async () => ({
					success: true,
					label: {
						id: 1,
						name: "テスト",
						description: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			const result = await apiClient.createLabel("テスト");
			expect(result.name).toBe("テスト");
		});

		test("誤ったContent-Typeでも処理を試みること", async () => {
			fetchMock.mockResolvedValueOnce({
				ok: true,
				headers: new Headers({ "content-type": "text/plain" }),
				json: async () => ({
					success: true,
					label: {
						id: 1,
						name: "テスト",
						description: null,
						createdAt: "2024-01-01T00:00:00Z",
						updatedAt: "2024-01-01T00:00:00Z",
					},
				}),
			} as Response);

			const result = await apiClient.createLabel("テスト");
			expect(result.name).toBe("テスト");
		});
	});
});
