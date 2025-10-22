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
	version: "0.7.0", // Updated version after removing rating functionality
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
			const errorMessage = error instanceof Error ? error.message : String(error);
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
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error("Error in getLabels tool:", errorMessage);
			return {
				content: [{ type: "text", text: `Error fetching labels: ${errorMessage}` }],
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
			await apiClient.assignLabelToArticle(articleId, labelName, description ?? undefined);
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
			const errorMessage = error instanceof Error ? error.message : String(error);
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

// 4. Tool to get a label by ID
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
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`Error in getLabelById tool (labelId: ${labelId}):`, errorMessage);
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

// 5. Tool to delete a label
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
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`Error in deleteLabel tool (labelId: ${labelId}):`, errorMessage);
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

// 6. Tool to assign labels to multiple articles
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
			// 入力値の検証
			if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
				throw new Error("articleIds must be a non-empty array");
			}
			if (!labelName || typeof labelName !== "string") {
				throw new Error("labelName must be a non-empty string");
			}

			console.log("Calling assignLabelsToMultipleArticles with:", {
				articleIds,
				labelName,
				description,
			});

			const result = await apiClient.assignLabelsToMultipleArticles(articleIds, labelName, description ?? undefined);
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
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(
				`Error in assignLabelsToMultipleArticles tool (articleIds: ${JSON.stringify(articleIds)}, labelName: ${labelName}, description: ${description}):`,
				errorMessage,
			);
			console.error("Full error details:", error);
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

// 7. Tool to get unread bookmarks
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
			const errorMessage = error instanceof Error ? error.message : String(error);
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

// 8. Tool to mark bookmark as read
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
			const errorMessage = error instanceof Error ? error.message : String(error);
			console.error(`Error in markBookmarkAsRead tool (bookmarkId: ${bookmarkId}):`, errorMessage);
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
