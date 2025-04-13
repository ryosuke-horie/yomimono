// Remove dotenv import and config call - rely on Bun's automatic .env loading
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as apiClient from "./lib/apiClient.js";

// Create an MCP server instance
const server = new McpServer({
	name: "EffectiveYomimonoLabeler", // Descriptive name for the server
	version: "0.1.0", // Initial version
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
				content: [
					{ type: "text", text: JSON.stringify(articles, null, 2) },
				],
				isError: false,
			};
		} catch (error: any) {
			console.error("Error in getUnlabeledArticles tool:", error.message);
			return {
				content: [
					{ type: "text", text: `Error fetching unlabeled articles: ${error.message}` },
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
		} catch (error: any) {
			console.error("Error in getLabels tool:", error.message);
			return {
				content: [{ type: "text", text: `Error fetching labels: ${error.message}` }],
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
	},
	async ({ articleId, labelName }) => { // Destructure arguments
		try {
			await apiClient.assignLabelToArticle(articleId, labelName);
			return {
				content: [
					{
						type: "text",
						text: `Successfully assigned label "${labelName}" to article ID ${articleId}.`,
					},
				],
				isError: false,
			};
		} catch (error: any) {
			console.error(
				`Error in assignLabel tool (articleId: ${articleId}, labelName: ${labelName}):`,
				error.message,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to assign label: ${error.message}`, // Use 'error' instead of 'fetchError'
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
	},
	async ({ labelName }) => { // Destructure arguments
		try {
			const newLabel = await apiClient.createLabel(labelName);
			return {
				content: [
					{
						type: "text",
						text: `Successfully created label: ${JSON.stringify(newLabel, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: any) {
			console.error(
				`Error in createLabel tool (labelName: ${labelName}):`,
				error.message,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to create label: ${error.message}`,
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
