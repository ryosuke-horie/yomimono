import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as apiClient from "./lib/apiClient.js";

type ToolContent = {
	type: "text";
	text: string;
};

type ToolResult = {
	content: ToolContent[];
	isError: boolean;
};

function wrapSuccess(text: string): ToolResult {
	return {
		content: [{ type: "text", text }],
		isError: false,
	};
}

function wrapError(text: string): ToolResult {
	return {
		content: [{ type: "text", text }],
		isError: true,
	};
}

export async function handleGetUnlabeledArticlesTool(): Promise<ToolResult> {
	try {
		const articles = await apiClient.getUnlabeledArticles();
		return wrapSuccess(JSON.stringify(articles, null, 2));
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("Error in getUnlabeledArticles tool:", errorMessage);
		return wrapError(`Error fetching unlabeled articles: ${errorMessage}`);
	}
}

export async function handleGetLabelsTool(): Promise<ToolResult> {
	try {
		const labels = await apiClient.getLabels();
		return wrapSuccess(JSON.stringify(labels, null, 2));
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("Error in getLabels tool:", errorMessage);
		return wrapError(`Error fetching labels: ${errorMessage}`);
	}
}

export async function handleAssignLabelTool({
	articleId,
	labelName,
	description,
}: {
	articleId: number;
	labelName: string;
	description?: string | null;
}): Promise<ToolResult> {
	try {
		await apiClient.assignLabelToArticle(articleId, labelName, description ?? undefined);
		return wrapSuccess(`Successfully assigned label "${labelName}" to article ID ${articleId}.`);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(
			`Error in assignLabel tool (articleId: ${articleId}, labelName: ${labelName}, description: ${description}):`,
			errorMessage,
		);
		return wrapError(`Failed to assign label: ${errorMessage}`);
	}
}

export async function handleGetLabelByIdTool({ labelId }: { labelId: number }): Promise<ToolResult> {
	try {
		const label = await apiClient.getLabelById(labelId);
		return wrapSuccess(`Label details: ${JSON.stringify(label, null, 2)}`);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`Error in getLabelById tool (labelId: ${labelId}):`, errorMessage);
		return wrapError(`Failed to get label: ${errorMessage}`);
	}
}

export async function handleAssignLabelsToMultipleArticlesTool({
	articleIds,
	labelName,
	description,
}: {
	articleIds: number[];
	labelName: string;
	description?: string | null;
}): Promise<ToolResult> {
	try {
		if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
			throw new Error("articleIds must be a non-empty array");
		}
		if (!labelName || typeof labelName !== "string") {
			throw new Error("labelName must be a non-empty string");
		}

		console.error("Calling assignLabelsToMultipleArticles with:", {
			articleIds,
			labelName,
			description,
		});

		const result = await apiClient.assignLabelsToMultipleArticles(articleIds, labelName, description ?? undefined);
		return wrapSuccess(
			`Successfully batch assigned label "${labelName}" to articles. Result: ${JSON.stringify(result, null, 2)}`,
		);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(
			`Error in assignLabelsToMultipleArticles tool (articleIds: ${JSON.stringify(articleIds)}, labelName: ${labelName}, description: ${description}):`,
			errorMessage,
		);
		console.error("Full error details:", error);
		return wrapError(`Failed to batch assign labels: ${errorMessage}`);
	}
}

export async function handleGetUnreadBookmarksTool(): Promise<ToolResult> {
	try {
		const bookmarks = await apiClient.getUnreadBookmarks();
		return wrapSuccess(`未読のブックマークリスト:\n${JSON.stringify(bookmarks, null, 2)}`);
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error("Error in getUnreadBookmarks tool:", errorMessage);
		return wrapError(`未読ブックマークの取得に失敗しました: ${errorMessage}`);
	}
}

export function registerTools(server: McpServer) {
	// --- ツール定義 ---

	// 1. ラベル未設定の記事を取得するツール
	server.tool(
		"getUnlabeledArticles",
		{}, // 引数なし
		async () => handleGetUnlabeledArticlesTool(),
	);

	// 2. 既存ラベル一覧を取得するツール
	server.tool(
		"getLabels",
		{}, // 引数なし
		async () => handleGetLabelsTool(),
	);

	// 3. 記事にラベルを付与するツール
	server.tool(
		"assignLabel",
		// Zodで引数スキーマを定義
		{
			articleId: z.number().int().positive(),
			labelName: z.string().min(1),
			description: z.string().optional().nullable(),
		},
		async ({ articleId, labelName, description }) => handleAssignLabelTool({ articleId, labelName, description }),
	);

	// 4. ラベルIDからラベルを取得するツール
	server.tool(
		"getLabelById",
		{
			labelId: z.number().int().positive(),
		},
		async ({ labelId }) => handleGetLabelByIdTool({ labelId }),
	);

	// 5. 複数記事にラベルを一括付与するツール
	server.tool(
		"assignLabelsToMultipleArticles",
		// Zodで引数スキーマを定義
		{
			articleIds: z.array(z.number().int().positive()),
			labelName: z.string().min(1),
			description: z.string().optional().nullable(),
		},
		async ({ articleIds, labelName, description }) =>
			handleAssignLabelsToMultipleArticlesTool({ articleIds, labelName, description }),
	);

	// 6. 未読ブックマークを取得するツール
	server.tool(
		"getUnreadBookmarks",
		{}, // 引数なし
		async () => handleGetUnreadBookmarksTool(),
	);

	// --- ツール定義ここまで ---
}
