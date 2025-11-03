import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./lib/apiClient.js", () => ({
	getUnlabeledArticles: vi.fn(),
	getLabels: vi.fn(),
	assignLabelToArticle: vi.fn(),
	getLabelById: vi.fn(),
	assignLabelsToMultipleArticles: vi.fn(),
	getUnreadBookmarks: vi.fn(),
}));

import * as apiClient from "./lib/apiClient.js";
import {
	handleAssignLabelsToMultipleArticlesTool,
	handleAssignLabelTool,
	handleGetLabelByIdTool,
	handleGetLabelsTool,
	handleGetUnlabeledArticlesTool,
	handleGetUnreadBookmarksTool,
} from "./tools.js";

const mockedApiClient = vi.mocked(apiClient);
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

describe("tool handlers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(() => {
		consoleErrorSpy.mockRestore();
	});

	it("handleGetUnlabeledArticlesTool: 未ラベル記事一覧をJSONとして返却する", async () => {
		const articles = [
			{
				id: 1,
				title: "記事1",
				url: "https://example.com/1",
				isRead: false,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-02T00:00:00.000Z",
			},
		];
		mockedApiClient.getUnlabeledArticles.mockResolvedValueOnce(articles);

		const result = await handleGetUnlabeledArticlesTool();

		expect(mockedApiClient.getUnlabeledArticles).toHaveBeenCalled();
		expect(result).toEqual({
			content: [{ type: "text", text: JSON.stringify(articles, null, 2) }],
			isError: false,
		});
	});

	it("handleGetLabelsTool: ラベル一覧をJSONとして返却する", async () => {
		const labels = [
			{
				id: 1,
				name: "Tech",
				description: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-02T00:00:00.000Z",
			},
		];
		mockedApiClient.getLabels.mockResolvedValueOnce(labels);

		const result = await handleGetLabelsTool();

		expect(mockedApiClient.getLabels).toHaveBeenCalled();
		expect(result).toEqual({
			content: [{ type: "text", text: JSON.stringify(labels, null, 2) }],
			isError: false,
		});
	});

	it("handleAssignLabelTool: 成功時は完了メッセージを返す", async () => {
		mockedApiClient.assignLabelToArticle.mockResolvedValueOnce(undefined);

		const result = await handleAssignLabelTool({ articleId: 42, labelName: "Tech", description: "desc" });

		expect(mockedApiClient.assignLabelToArticle).toHaveBeenCalledWith(42, "Tech", "desc");
		expect(result).toEqual({
			content: [{ type: "text", text: 'Successfully assigned label "Tech" to article ID 42.' }],
			isError: false,
		});
	});

	it("handleAssignLabelTool: 失敗時はエラーメッセージを返す", async () => {
		mockedApiClient.assignLabelToArticle.mockRejectedValueOnce(new Error("network failure"));

		const result = await handleAssignLabelTool({ articleId: 1, labelName: "Tech", description: null });

		expect(result).toEqual({
			content: [{ type: "text", text: "Failed to assign label: network failure" }],
			isError: true,
		});
		expect(consoleErrorSpy).toHaveBeenCalled();
	});

	it("handleGetLabelByIdTool: ラベル詳細をJSONとして返却する", async () => {
		const label = {
			id: 99,
			name: "Personal",
			description: "Private readings",
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-02T00:00:00.000Z",
		};
		mockedApiClient.getLabelById.mockResolvedValueOnce(label);

		const result = await handleGetLabelByIdTool({ labelId: 99 });

		expect(mockedApiClient.getLabelById).toHaveBeenCalledWith(99);
		expect(result).toEqual({
			content: [{ type: "text", text: `Label details: ${JSON.stringify(label, null, 2)}` }],
			isError: false,
		});
	});

	it("handleAssignLabelsToMultipleArticlesTool: 入力検証エラーを返す", async () => {
		const result = await handleAssignLabelsToMultipleArticlesTool({
			articleIds: [],
			labelName: "Tech",
			description: null,
		});

		expect(result).toEqual({
			content: [{ type: "text", text: "Failed to batch assign labels: articleIds must be a non-empty array" }],
			isError: true,
		});
	});

	it("handleGetUnreadBookmarksTool: 未読ブックマークを文字列化する", async () => {
		const bookmarks = [
			{
				id: 10,
				url: "https://example.com/10",
				title: "記事10",
				labels: ["Tech"],
				isRead: false,
				isFavorite: false,
				createdAt: "2024-01-01T00:00:00.000Z",
				readAt: null,
				updatedAt: "2024-01-02T00:00:00.000Z",
			},
		];
		mockedApiClient.getUnreadBookmarks.mockResolvedValueOnce(bookmarks);

		const result = await handleGetUnreadBookmarksTool();

		expect(mockedApiClient.getUnreadBookmarks).toHaveBeenCalled();
		expect(result).toEqual({
			content: [{ type: "text", text: `未読のブックマークリスト:\n${JSON.stringify(bookmarks, null, 2)}` }],
			isError: false,
		});
	});
});
