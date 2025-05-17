import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as dotenv from "dotenv";
import { z } from "zod";
import * as apiClient from "./lib/apiClient.js";

// Configure dotenv to load environment variables
dotenv.config();

// Create an MCP server instance
const server = new McpServer({
	name: "EffectiveYomimonoLabeler", // Descriptive name for the server
	version: "0.4.0", // Updated with getUnreadArticlesByLabel and read/unread status tools
});

// --- Tool Definitions ---

// 1. Tool to get unlabeled articles
server.tool(
	"getUnlabeledArticles",
	{}, // No input arguments
	async () => {
		try {
			const articles = await apiClient.getUnlabeledArticles();
			// Return the list of articles directly. Client needs to handle the structure.
			// We'll stringify it here for simple text output, but a structured format might be better.
			return {
				content: [{ type: "text", text: JSON.stringify(articles, null, 2) }],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getUnlabeledArticles tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `Error fetching unlabeled articles: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 2. Tool to get existing labels
server.tool(
	"getLabels",
	{}, // No input arguments
	async () => {
		try {
			const labels = await apiClient.getLabels();
			// Return the list of labels directly.
			return {
				content: [{ type: "text", text: JSON.stringify(labels, null, 2) }],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getLabels tool:", errorMessage);
			return {
				content: [
					{ type: "text", text: `Error fetching labels: ${errorMessage}` },
				],
				isError: true,
			};
		}
	},
);

// 3. Tool to assign a label to an article
server.tool(
	"assignLabel",
	// Define input arguments schema using Zod
	{
		articleId: z.number().int().positive(),
		labelName: z.string().min(1),
		description: z.string().optional().nullable(),
	},
	async ({ articleId, labelName, description }) => {
		// Destructure arguments
		try {
			await apiClient.assignLabelToArticle(
				articleId,
				labelName,
				description ?? undefined,
			);
			return {
				content: [
					{
						type: "text",
						text: `Successfully assigned label "${labelName}" to article ID ${articleId}.`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in assignLabel tool (articleId: ${articleId}, labelName: ${labelName}, description: ${description}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to assign label: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 4. Tool to create a new label
server.tool(
	"createLabel",
	// Define input arguments schema using Zod
	{
		labelName: z.string().min(1, "Label name cannot be empty"),
		description: z.string().optional().nullable(),
	},
	async ({ labelName, description }) => {
		// Destructure arguments
		try {
			const newLabel = await apiClient.createLabel(
				labelName,
				description ?? undefined,
			);
			return {
				content: [
					{
						type: "text",
						text: `Successfully created label: ${JSON.stringify(newLabel, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in createLabel tool (labelName: ${labelName}, description: ${description}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to create label: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 5. Tool to get a label by ID
server.tool(
	"getLabelById",
	{
		labelId: z.number().int().positive(),
	},
	async ({ labelId }) => {
		try {
			const label = await apiClient.getLabelById(labelId);
			return {
				content: [
					{
						type: "text",
						text: `Label details: ${JSON.stringify(label, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in getLabelById tool (labelId: ${labelId}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to get label: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 6. Tool to delete a label
server.tool(
	"deleteLabel",
	{
		labelId: z.number().int().positive(),
	},
	async ({ labelId }) => {
		try {
			await apiClient.deleteLabel(labelId);
			return {
				content: [
					{
						type: "text",
						text: `Successfully deleted label ID ${labelId}.`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in deleteLabel tool (labelId: ${labelId}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to delete label: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 7. Tool to update a label's description
server.tool(
	"updateLabelDescription",
	{
		labelId: z.number().int().positive(),
		description: z.string().nullable(),
	},
	async ({ labelId, description }) => {
		try {
			const updatedLabel = await apiClient.updateLabelDescription(
				labelId,
				description,
			);
			return {
				content: [
					{
						type: "text",
						text: `Successfully updated label description: ${JSON.stringify(updatedLabel, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in updateLabelDescription tool (labelId: ${labelId}, description: ${description}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to update label description: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 8. Tool to assign labels to multiple articles
server.tool(
	"assignLabelsToMultipleArticles",
	// Define input arguments schema using Zod
	{
		articleIds: z.array(z.number().int().positive()),
		labelName: z.string().min(1),
		description: z.string().optional().nullable(),
	},
	async ({ articleIds, labelName, description }) => {
		// Destructure arguments
		try {
			const result = await apiClient.assignLabelsToMultipleArticles(
				articleIds,
				labelName,
				description ?? undefined,
			);
			return {
				content: [
					{
						type: "text",
						text: `Successfully batch assigned label "${labelName}" to articles. Result: ${JSON.stringify(result, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in assignLabelsToMultipleArticles tool (articleIds: ${articleIds}, labelName: ${labelName}, description: ${description}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to batch assign labels: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 9. Tool to get bookmarks without summary
server.tool(
	"getBookmarksWithoutSummary",
	{
		limit: z.number().int().positive().optional(),
		orderBy: z.enum(["createdAt", "readAt"]).optional(),
	},
	async ({ limit, orderBy }) => {
		try {
			const bookmarks = await apiClient.getBookmarksWithoutSummary(
				limit,
				orderBy,
			);
			return {
				content: [{ type: "text", text: JSON.stringify(bookmarks, null, 2) }],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in getBookmarksWithoutSummary tool (limit: ${limit}, orderBy: ${orderBy}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to get bookmarks without summary: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 10. Tool to save summary
server.tool(
	"saveSummary",
	{
		bookmarkId: z.number().int().positive(),
		summary: z.string().min(1),
	},
	async ({ bookmarkId, summary }) => {
		try {
			const bookmark = await apiClient.saveSummary(bookmarkId, summary);
			return {
				content: [
					{
						type: "text",
						text: `Successfully saved summary for bookmark ID ${bookmarkId}: ${JSON.stringify(bookmark, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in saveSummary tool (bookmarkId: ${bookmarkId}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to save summary: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 11. Tool to update summary
server.tool(
	"updateSummary",
	{
		bookmarkId: z.number().int().positive(),
		summary: z.string().min(1),
	},
	async ({ bookmarkId, summary }) => {
		try {
			const bookmark = await apiClient.updateSummary(bookmarkId, summary);
			return {
				content: [
					{
						type: "text",
						text: `Successfully updated summary for bookmark ID ${bookmarkId}: ${JSON.stringify(bookmark, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in updateSummary tool (bookmarkId: ${bookmarkId}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to update summary: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 12. Tool to get bookmark by ID
server.tool(
	"getBookmarkById",
	{
		bookmarkId: z.number().int().positive(),
	},
	async ({ bookmarkId }) => {
		try {
			const bookmark = await apiClient.getBookmarkById(bookmarkId);
			return {
				content: [
					{
						type: "text",
						text: `Bookmark details: ${JSON.stringify(bookmark, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in getBookmarkById tool (bookmarkId: ${bookmarkId}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to get bookmark: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 13. Tool to generate summary for a bookmark
server.tool(
	"generateSummary",
	{
		bookmarkId: z.number().int().positive(),
		includeKeyPoints: z.boolean().optional().default(true),
		maxLength: z.number().int().positive().optional().default(500),
	},
	async ({ bookmarkId, includeKeyPoints, maxLength }) => {
		try {
			// 記事情報を取得
			const bookmark = await apiClient.getBookmarkById(bookmarkId);

			// 既に要約が存在する場合は警告
			if (bookmark.summary) {
				return {
					content: [
						{
							type: "text",
							text: `Bookmark ${bookmarkId} already has a summary. Use updateSummary to modify it.`,
						},
					],
					isError: true,
				};
			}

			// URLから記事内容を取得（実際の実装では記事本文を取得する）
			// ここは仮実装として、タイトルとURLを使用
			const summaryPrompt = `
以下の記事を要約してください:
タイトル: ${bookmark.title || "タイトルなし"}
URL: ${bookmark.url}

要約条件:
- 最大${maxLength}文字で簡潔に
${includeKeyPoints ? "- 主要なポイントを箇条書きで含める" : ""}
- 日本語で記述
- 技術記事として重要な情報を優先
`;

			// ここで実際にはLLMを呼び出して要約を生成
			// 現時点では仮の要約を生成
			const mockSummary = `この記事は「${bookmark.title || "untitled"}」に関する内容です。
${
	includeKeyPoints
		? `
主要なポイント:
• 技術的な概要
• 実装のアプローチ
• 利用されている技術スタック
• まとめと結論`
		: ""
}

詳細な内容は元記事をご確認ください。`;

			// 要約を保存
			const updatedBookmark = await apiClient.saveSummary(
				bookmarkId,
				mockSummary,
			);

			return {
				content: [
					{
						type: "text",
						text: `Successfully generated and saved summary for bookmark ${bookmarkId}:\n${JSON.stringify(updatedBookmark, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in generateSummary tool (bookmarkId: ${bookmarkId}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to generate summary: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 14. Tool to get unread articles by label
server.tool(
	"getUnreadArticlesByLabel",
	{
		labelName: z.string().min(1),
	},
	async ({ labelName }) => {
		try {
			const articles = await apiClient.getUnreadArticlesByLabel(labelName);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(articles, null, 2),
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in getUnreadArticlesByLabel tool (labelName: ${labelName}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to get unread articles by label: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 15. Tool to get unread bookmarks
server.tool(
	"getUnreadBookmarks",
	{}, // No input arguments
	async () => {
		try {
			const bookmarks = await apiClient.getUnreadBookmarks();
			return {
				content: [
					{
						type: "text",
						text: `未読のブックマークリスト:\n${JSON.stringify(bookmarks, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getUnreadBookmarks tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `未読ブックマークの取得に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 16. Tool to get read bookmarks
server.tool(
	"getReadBookmarks",
	{}, // No input arguments
	async () => {
		try {
			const bookmarks = await apiClient.getReadBookmarks();
			return {
				content: [
					{
						type: "text",
						text: `既読のブックマークリスト:\n${JSON.stringify(bookmarks, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getReadBookmarks tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `既読ブックマークの取得に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 17. Tool to mark bookmark as read
server.tool(
	"markBookmarkAsRead",
	{
		bookmarkId: z.number().int().positive(),
	},
	async ({ bookmarkId }) => {
		try {
			const result = await apiClient.markBookmarkAsRead(bookmarkId);
			return {
				content: [
					{
						type: "text",
						text: `ブックマークID: ${bookmarkId}を既読にマークしました。\n${JSON.stringify(result, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in markBookmarkAsRead tool (bookmarkId: ${bookmarkId}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `ブックマークの既読マークに失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// --- End Tool Definition ---

async function main() {
	// Use Stdio transport for initial development
	const transport = new StdioServerTransport();

	try {
		// Connect the server to the transport
		await server.connect(transport);
	} catch (error) {
		// Keep console.error for actual errors (goes to stderr)
		console.error("Failed to connect MCP server:", error);
		process.exit(1); // Exit if connection fails
	}
}

main();
