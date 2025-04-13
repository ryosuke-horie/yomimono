import dotenv from "dotenv";
dotenv.config({ path: "../.env" }); // Load .env from the parent (mcp) directory

import { z } from "zod";

// Define schemas for API responses (adjust based on actual API implementation)
const ArticleSchema = z.object({
	id: z.number(),
	title: z.string(),
	url: z.string(),
	// Add other relevant fields if needed
});
// Correct schema to match API response { success: boolean, bookmarks: [...] }
const ArticlesResponseSchema = z.object({
	success: z.literal(true),
	bookmarks: z.array(ArticleSchema), // Key is 'bookmarks', not 'articles'
});

const LabelSchema = z.object({
	id: z.number(),
	name: z.string(),
});
const LabelsResponseSchema = z.object({
	labels: z.array(LabelSchema),
});

// Get API base URL from environment variable
const API_BASE_URL = process.env.API_BASE_URL;
if (!API_BASE_URL) {
	throw new Error("API_BASE_URL environment variable is not set.");
}

/**
 * Fetches unlabeled articles from the API.
 * @returns A promise that resolves to an array of unlabeled articles.
 */
export async function getUnlabeledArticles() {
	// Corrected path: /api/bookmarks/unlabeled
	const response = await fetch(`${API_BASE_URL}/api/bookmarks/unlabeled`);
	if (!response.ok) {
		throw new Error(`Failed to fetch unlabeled articles: ${response.statusText}`);
	}
	const data = await response.json();
	const parsed = ArticlesResponseSchema.safeParse(data);
	if (!parsed.success) {
		// Provide more context in the error message
		throw new Error(
			`Invalid API response for unlabeled articles. Expected { success: true, bookmarks: [...] }, received: ${JSON.stringify(data)}. Zod errors: ${parsed.error}`,
		);
	}
	// Extract data from 'bookmarks' key
	return parsed.data.bookmarks;
}

/**
 * Fetches existing labels from the API.
 * @returns A promise that resolves to an array of existing labels.
 */
export async function getLabels() {
	const response = await fetch(`${API_BASE_URL}/api/labels`);
	if (!response.ok) {
		throw new Error(`Failed to fetch labels: ${response.statusText}`);
	}
	const data = await response.json();
	const parsed = LabelsResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(`Invalid API response for labels: ${parsed.error}`);
	}
	return parsed.data.labels;
}

/**
 * Assigns a label to a specific article via the API.
 * @param articleId - The ID of the article to label.
 * @param labelName - The name of the label to assign.
 * @returns A promise that resolves when the label is successfully assigned.
 */
export async function assignLabelToArticle(articleId: number, labelName: string) {
	// Corrected path: /api/bookmarks/:id/label
	const response = await fetch(`${API_BASE_URL}/api/bookmarks/${articleId}/label`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ labelName }),
	});

	if (!response.ok) {
		// Consider more specific error handling based on status code if needed
		throw new Error(
			`Failed to assign label "${labelName}" to article ${articleId}: ${response.statusText}`,
		);
	}
	// Assuming the API returns no content or confirmation on success
}
