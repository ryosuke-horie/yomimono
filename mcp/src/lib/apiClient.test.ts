import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assignLabelToArticle, getUnlabeledArticles } from "./apiClient.js";

const API_BASE_URL = "https://api.example.test";

type FetchMock = ReturnType<typeof vi.fn>;

describe("apiClient", () => {
	let fetchMock: FetchMock;

	beforeEach(() => {
		process.env.API_BASE_URL = API_BASE_URL;
		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		fetchMock.mockReset();
		vi.unstubAllGlobals();
	});

	afterAll(() => {
		delete process.env.API_BASE_URL;
	});

	it("getUnlabeledArticles: APIレスポンスを正しく整形する", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			json: async () => ({
				success: true,
				bookmarks: [
					{
						id: 1,
						title: "記事1",
						url: "https://example.com/1",
						isRead: false,
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-02T00:00:00.000Z",
					},
				],
			}),
		});

		const result = await getUnlabeledArticles();

		expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/api/bookmarks/unlabeled`, undefined);
		expect(result).toEqual([
			{
				id: 1,
				title: "記事1",
				url: "https://example.com/1",
				isRead: false,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-02T00:00:00.000Z",
				label: null,
				isFavorite: false,
			},
		]);
	});

	it("getUnlabeledArticles: レスポンスがスキーマに適合しない場合は例外を投げる", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			status: 200,
			statusText: "OK",
			json: async () => ({
				success: true,
				articles: [], // 想定外のキー
			}),
		});

		await expect(getUnlabeledArticles()).rejects.toThrowError(/Failed to fetch unlabeled articles/);
	});

	it("assignLabelToArticle: エラーレスポンスのメッセージを伝播する", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: false,
			status: 400,
			statusText: "Bad Request",
			json: async () => ({
				message: "label already exists",
			}),
		});

		await expect(assignLabelToArticle(42, "既存ラベル")).rejects.toThrowError(
			'Failed to assign label "既存ラベル" to article 42: label already exists',
		);
	});
});
