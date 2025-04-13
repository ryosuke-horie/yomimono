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

// --- Tool Definition ---

server.tool(
	"autoLabelArticles",
	{}, // Pass an empty object literal for no parameters, instead of z.object({})
	async (args) => {
		let processedCount = 0;
		let errorCount = 0;
		const errors: string[] = []; // Restore errors array

		// --- Restore Original Logic ---
		try {
			const [articles, labels] = await Promise.all([ // Restore fetching labels
				apiClient.getUnlabeledArticles(),
				apiClient.getLabels(),
			]);

			for (const article of articles) { // Restore loop
				try {
					// --- Placeholder Labeling Logic ---
					// TODO: Replace with actual LLM call or more sophisticated logic
					let determinedLabel = "needs-review"; // Default dummy label
					const titleLower = article.title.toLowerCase();
					if (titleLower.includes("typescript") || titleLower.includes("ts")) {
						determinedLabel = "typescript";
					} else if (titleLower.includes("react")) {
						determinedLabel = "react";
					} else if (titleLower.includes("cloudflare")) {
						determinedLabel = "cloudflare";
					}
					// --- End Placeholder Logic ---

					await apiClient.assignLabelToArticle(article.id, determinedLabel); // Restore API call
					processedCount++;
				} catch (labelError: any) {
					console.error( // Keep error logging
						`Error assigning label to article ${article.id}:`,
						labelError.message,
					);
					errors.push( // Restore error tracking
						`Article ${article.id} (${article.title}): ${labelError.message}`,
					);
					errorCount++;
				}
			}

			const summary = `Labeling process completed. Processed: ${processedCount}, Errors: ${errorCount}.`; // Restore summary
			if (errors.length > 0) {
				// Keep console.error for actual errors (goes to stderr)
				console.error("Errors encountered:\n- ", errors.join("\n- "));
			}

			return { // Restore original return object
				content: [{ type: "text", text: summary }],
				isError: errorCount > 0, // Indicate error if any labeling failed
			};
		} catch (fetchError: any) {
			console.error("Error fetching data for labeling:", fetchError.message); // Keep fetch error logging
			return {
				content: [
					{
						type: "text",
						text: `Failed to start labeling process: ${fetchError.message}`,
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
