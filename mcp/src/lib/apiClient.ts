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
	success: z.literal(true), // Assuming the GET /labels also returns success: true
	labels: z.array(LabelSchema),
});

// Schema for the POST /api/labels response
const CreateLabelResponseSchema = z.object({
	success: z.literal(true),
	label: LabelSchema,
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
	const data: unknown = await response.json(); // Explicitly type as unknown
	const parsed = LabelsResponseSchema.safeParse(data);
	if (!parsed.success) {
		// Use parsed.error for detailed Zod errors
		throw new Error(`Invalid API response for labels: ${parsed.error.message}`);
	}
	// Access success property safely through parsed data
	if (!parsed.data.success) {
		throw new Error(
			`API indicated failure when fetching labels: ${JSON.stringify(parsed.data)}`,
		);
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
	// Check for specific success status codes if applicable (e.g., 200 OK, 204 No Content)
}

/**
 * Creates a new label via the API.
 * @param labelName - The name of the label to create.
 * @returns A promise that resolves to the newly created label object.
 */
export async function createLabel(labelName: string) {
	const response = await fetch(`${API_BASE_URL}/api/labels`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ name: labelName }),
	});

	let data: unknown;
	try {
		// Check content type before parsing, or handle potential empty body for 201/204
		const contentType = response.headers.get("content-type");
		if (response.ok && (!contentType || !contentType.includes("application/json"))) {
			// If response is OK but not JSON (e.g., 201 with empty body or wrong content type)
			// We might assume success based on status code, or throw an error if JSON is expected.
			// Let's assume the API *should* return JSON on success based on its route handler.
			// If parsing fails below, it indicates an issue.
		}
		data = await response.json(); // Attempt to parse JSON
	} catch (parseError: any) {
		// Handle JSON parsing error
		if (!response.ok) {
			// If the request failed and JSON parsing failed, throw an error including status
			throw new Error(`Failed to create label "${labelName}". Status: ${response.status} ${response.statusText}. Response body could not be parsed: ${parseError.message}`);
		} else {
			// If the request succeeded (e.g., 201) but parsing failed (unexpected)
			throw new Error(`Successfully created label "${labelName}" (Status: ${response.status}) but received an invalid or empty JSON response: ${parseError.message}`);
		}
	}


	if (!response.ok) {
		// If response is not ok, but JSON parsing succeeded, try to extract error message
		let errorMessage = `Failed to create label "${labelName}"`;
		if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
			errorMessage = data.message;
		}
		throw new Error(`${errorMessage}: ${response.statusText} (Status: ${response.status})`);
	}

	// If response.ok and JSON parsing succeeded, validate with Zod
	const parsed = CreateLabelResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response after creating label. Zod errors: ${parsed.error.message}`, // Use .message for cleaner Zod error
		);
	}

	return parsed.data.label;
}
