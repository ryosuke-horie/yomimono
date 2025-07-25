import { z } from "zod";

// Define schemas for API responses (adjust based on actual API implementation)
const ArticleSchema = z.object({
	id: z.number(),
	title: z.string(),
	url: z.string(),
	isRead: z.boolean(),
	isFavorite: z.boolean().optional(), // isFavoriteを任意項目にする
	label: z
		.object({
			id: z.number(),
			name: z.string(),
			description: z.string().nullable(),
			createdAt: z.string().or(z.instanceof(Date)),
			updatedAt: z.string().or(z.instanceof(Date)),
		})
		.nullable()
		.optional(), // labelを任意項目にする
	createdAt: z.string().or(z.instanceof(Date)),
	updatedAt: z.string().or(z.instanceof(Date)),
});

// Export type for use in other modules
export type BookmarkWithLabel = z.infer<typeof ArticleSchema>;
// Correct schema to match API response { success: boolean, bookmarks: [...] }
const ArticlesResponseSchema = z.object({
	success: z.literal(true),
	bookmarks: z.array(ArticleSchema), // Key is 'bookmarks', not 'articles'
});

const LabelSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullable().optional(),
	createdAt: z.string().or(z.instanceof(Date)).optional(),
	updatedAt: z.string().or(z.instanceof(Date)).optional(),
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

// Schema for the GET /api/labels/:id response
const GetLabelByIdResponseSchema = z.object({
	success: z.literal(true),
	label: LabelSchema,
});

// Schema for the PATCH /api/labels/:id response
const UpdateLabelDescriptionResponseSchema = z.object({
	success: z.literal(true),
	label: LabelSchema,
});

// Schema for the DELETE /api/labels/:id response
const DeleteLabelResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
});

// Schema for the DELETE /api/labels/cleanup response
const CleanupLabelsResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
	deletedCount: z.number(),
	deletedLabels: z.array(
		z.object({
			id: z.number(),
			name: z.string(),
		}),
	),
});

// Get API base URL from environment variable
function getApiBaseUrl(): string {
	const API_BASE_URL = process.env.API_BASE_URL;
	if (!API_BASE_URL) {
		throw new Error("API_BASE_URL environment variable is not set.");
	}
	return API_BASE_URL;
}

/**
 * Fetches unlabeled articles from the API.
 * @returns A promise that resolves to an array of unlabeled articles.
 */
export async function getUnlabeledArticles() {
	// Corrected path: /api/bookmarks/unlabeled
	const response = await fetch(`${getApiBaseUrl()}/api/bookmarks/unlabeled`);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch unlabeled articles: ${response.statusText}`,
		);
	}
	const data = await response.json();

	// /api/bookmarks/unlabeledは基本的なBookmarkオブジェクトを返すため、
	// labelプロパティを持たない。labelをnullとして追加する。
	const UnlabeledArticlesResponseSchema = z.object({
		success: z.literal(true),
		bookmarks: z.array(
			z.object({
				id: z.number(),
				title: z.string(),
				url: z.string(),
				isRead: z.boolean(),
				createdAt: z.string().or(z.instanceof(Date)),
				updatedAt: z.string().or(z.instanceof(Date)),
			}),
		),
	});

	const parsed = UnlabeledArticlesResponseSchema.safeParse(data);
	if (!parsed.success) {
		// Provide more context in the error message
		throw new Error(
			`Invalid API response for unlabeled articles. Expected { success: true, bookmarks: [...] }, received: ${JSON.stringify(data)}. Zod errors: ${parsed.error.message}`,
		);
	}
	// Extract data from 'bookmarks' key and add label: null for compatibility
	return parsed.data.bookmarks.map((bookmark) => ({
		...bookmark,
		label: null,
		isFavorite: false, // デフォルト値を設定
	}));
}

/**
 * Fetches existing labels from the API.
 * @returns A promise that resolves to an array of existing labels.
 */
export async function getLabels() {
	const response = await fetch(`${getApiBaseUrl()}/api/labels`);
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
 * @param description - Optional description for the label if it's created.
 * @returns A promise that resolves when the label is successfully assigned.
 */
export async function assignLabelToArticle(
	articleId: number,
	labelName: string,
	description?: string,
) {
	// Corrected path: /api/bookmarks/:id/label
	const response = await fetch(
		`${getApiBaseUrl()}/api/bookmarks/${articleId}/label`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				labelName,
				description,
			}),
		},
	);

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
 * @param description - Optional description for the label.
 * @returns A promise that resolves to the newly created label object.
 */
export async function createLabel(labelName: string, description?: string) {
	const response = await fetch(`${getApiBaseUrl()}/api/labels`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			name: labelName,
			description: description,
		}),
	});

	let data: unknown;
	try {
		// Check content type before parsing, or handle potential empty body for 201/204
		const contentType = response.headers.get("content-type");
		if (
			response.ok &&
			(!contentType || !contentType.includes("application/json"))
		) {
			// If response is OK but not JSON (e.g., 201 with empty body or wrong content type)
			// We might assume success based on status code, or throw an error if JSON is expected.
			// Let's assume the API *should* return JSON on success based on its route handler.
			// If parsing fails below, it indicates an issue.
		}
		data = await response.json(); // Attempt to parse JSON
	} catch (parseError: unknown) {
		// Handle JSON parsing error
		const errorMessage =
			parseError instanceof Error ? parseError.message : String(parseError);
		if (!response.ok) {
			// If the request failed and JSON parsing failed, throw an error including status
			throw new Error(
				`Failed to create label "${labelName}". Status: ${response.status} ${response.statusText}. Response body could not be parsed: ${errorMessage}`,
			);
		}
		// If the request succeeded (e.g., 201) but parsing failed (unexpected)
		throw new Error(
			`Successfully created label "${labelName}" (Status: ${response.status}) but received an invalid or empty JSON response: ${errorMessage}`,
		);
	}

	if (!response.ok) {
		// If response is not ok, but JSON parsing succeeded, try to extract error message
		let errorMessage = `Failed to create label "${labelName}"`;
		if (
			typeof data === "object" &&
			data !== null &&
			"message" in data &&
			typeof data.message === "string"
		) {
			errorMessage = data.message;
		}
		throw new Error(
			`${errorMessage}: ${response.statusText} (Status: ${response.status})`,
		);
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

/**
 * Fetches a specific label by ID from the API.
 * @param id - The ID of the label to fetch.
 * @returns A promise that resolves to the label object.
 */
export async function getLabelById(id: number) {
	const response = await fetch(`${getApiBaseUrl()}/api/labels/${id}`);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch label with ID ${id}: ${response.statusText}`,
		);
	}

	let data: unknown;
	try {
		data = await response.json();
	} catch (parseError: unknown) {
		const errorMessage =
			parseError instanceof Error ? parseError.message : String(parseError);
		throw new Error(
			`Failed to parse response when fetching label ${id}: ${errorMessage}`,
		);
	}

	const parsed = GetLabelByIdResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response for label ${id}: ${parsed.error.message}`,
		);
	}

	return parsed.data.label;
}

/**
 * Updates a label's description via the API.
 * @param id - The ID of the label to update.
 * @param description - The new description (or null to remove the description).
 * @returns A promise that resolves to the updated label object.
 */
export async function updateLabelDescription(
	id: number,
	description: string | null,
) {
	const response = await fetch(`${getApiBaseUrl()}/api/labels/${id}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ description }),
	});

	if (!response.ok) {
		throw new Error(
			`Failed to update description for label ${id}: ${response.statusText}`,
		);
	}

	let data: unknown;
	try {
		data = await response.json();
	} catch (parseError: unknown) {
		const errorMessage =
			parseError instanceof Error ? parseError.message : String(parseError);
		throw new Error(
			`Failed to parse response when updating label ${id} description: ${errorMessage}`,
		);
	}

	const parsed = UpdateLabelDescriptionResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response after updating label description: ${parsed.error.message}`,
		);
	}

	return parsed.data.label;
}

export async function deleteLabel(id: number): Promise<void> {
	const response = await fetch(`${getApiBaseUrl()}/api/labels/${id}`, {
		method: "DELETE",
	});

	let data: unknown;
	try {
		data = await response.json();
	} catch (parseError: unknown) {
		const errorMessage =
			parseError instanceof Error ? parseError.message : String(parseError);
		if (!response.ok) {
			throw new Error(
				`Failed to delete label ${id}. Status: ${response.status} ${response.statusText}`,
			);
		}
		throw new Error(
			`Unexpected response format when deleting label ${id}: ${errorMessage}`,
		);
	}

	if (!response.ok) {
		let errorMessage = `Failed to delete label ${id}`;
		if (
			typeof data === "object" &&
			data !== null &&
			"message" in data &&
			typeof data.message === "string"
		) {
			errorMessage = data.message;
		}
		throw new Error(
			`${errorMessage}: ${response.statusText} (Status: ${response.status})`,
		);
	}

	const parsed = DeleteLabelResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response after deleting label. Zod errors: ${parsed.error.message}`,
		);
	}
}

/**
 * 複数の記事に一括でラベルを付与します。
 * @param articleIds - ラベルを付与する記事IDの配列
 * @param labelName - 付与するラベル名
 * @param description - ラベルの説明（オプション）
 * @returns 処理結果（成功数、スキップ数、エラー情報、ラベル）
 */
export async function assignLabelsToMultipleArticles(
	articleIds: number[],
	labelName: string,
	description?: string,
): Promise<{
	successful: number;
	skipped: number;
	errors: Array<{ articleId: number; error: string }>;
	label: z.infer<typeof LabelSchema>;
}> {
	const response = await fetch(`${getApiBaseUrl()}/api/bookmarks/batch-label`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			articleIds,
			labelName,
			description,
		}),
	});

	let data: unknown;
	try {
		data = await response.json();
	} catch (parseError: unknown) {
		const errorMessage =
			parseError instanceof Error ? parseError.message : String(parseError);
		throw new Error(
			`Failed to parse response for batch label assignment: ${errorMessage}`,
		);
	}

	if (!response.ok) {
		let errorMessage = `Failed to batch assign label "${labelName}"`;
		if (
			typeof data === "object" &&
			data !== null &&
			"message" in data &&
			typeof data.message === "string"
		) {
			errorMessage = data.message;
		}
		throw new Error(`${errorMessage}: ${response.statusText}`);
	}

	// バッチ結果のスキーマを定義
	const BatchResultSchema = z.object({
		success: z.literal(true),
		successful: z.number(),
		skipped: z.number(),
		errors: z.array(
			z.object({
				articleId: z.number(),
				error: z.string(),
			}),
		),
		label: LabelSchema,
	});

	const parsed = BatchResultSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response for batch label assignment: ${parsed.error.message}`,
		);
	}

	// successプロパティを除いた結果を返す
	const { success: _success, ...result } = parsed.data;
	return result;
}

// Schema for bookmark
const BookmarkSchema = z.object({
	id: z.number(),
	url: z.string(),
	title: z.string().nullable(),
	isRead: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

// Schema for single bookmark response
const BookmarkResponseSchema = z.object({
	success: z.literal(true),
	bookmark: BookmarkSchema,
});

/**
 * 特定のブックマークを取得します
 * @param bookmarkId - ブックマークID
 * @returns ブックマーク情報
 */
export async function getBookmarkById(bookmarkId: number) {
	const response = await fetch(
		`${getApiBaseUrl()}/api/bookmarks/${bookmarkId}`,
	);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch bookmark ${bookmarkId}: ${response.statusText}`,
		);
	}

	const data = await response.json();
	const parsed = BookmarkResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response for bookmark ${bookmarkId}: ${parsed.error.message}`,
		);
	}
	return parsed.data.bookmark;
}

// Schema for bookmark with read status
const BookmarkWithReadStatusSchema = z
	.object({
		id: z.number(),
		url: z.string(),
		title: z.string(),
		labels: z.array(z.string()).optional(), // labelsを任意項目にする
		isRead: z.boolean(),
		isFavorite: z.boolean().optional(), // isFavoriteを任意項目にする（APIレスポンスに応じて）
		createdAt: z.string(),
		readAt: z.string().nullable().optional(), // readAtを任意項目にする
		updatedAt: z.string().optional(), // updatedAtを追加（通常の未読ブックマークで必要）
	})
	.transform((data) => ({
		...data,
		labels: data.labels ?? [], // labelsがundefinedの場合は空配列を設定
		isFavorite: data.isFavorite ?? false, // isFavoriteがundefinedの場合はfalseを設定
	}));

// Schema for bookmarks list response
const BookmarksListResponseSchema = z.object({
	success: z.literal(true),
	bookmarks: z.array(BookmarkWithReadStatusSchema),
});

// Schema for mark as read response
const MarkAsReadResponseSchema = z.object({
	success: z.literal(true),
	message: z.string(),
});

/**
 * ラベルで未読記事を取得します
 * @param labelName - ラベル名
 * @returns 指定したラベルの未読記事のリスト
 */
export async function getUnreadArticlesByLabel(labelName: string) {
	const response = await fetch(
		`${getApiBaseUrl()}/api/bookmarks?label=${encodeURIComponent(labelName)}`,
	);
	if (!response.ok) {
		throw new Error(
			`Failed to fetch unread articles for label "${labelName}": ${response.statusText}`,
		);
	}

	const data = await response.json();
	const parsed = ArticlesResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response for unread articles by label: ${parsed.error.message}`,
		);
	}
	return parsed.data.bookmarks;
}

/**
 * 未読のブックマークを取得します
 * @returns 未読のブックマークのリスト
 */
export async function getUnreadBookmarks() {
	// Default behavior of /api/bookmarks is to return unread bookmarks
	const response = await fetch(`${getApiBaseUrl()}/api/bookmarks`);
	if (!response.ok) {
		throw new Error(`Failed to fetch unread bookmarks: ${response.statusText}`);
	}

	const data = await response.json();
	// /api/bookmarksはArticleSchemaの形式で返すため、ArticlesResponseSchemaを使用
	const parsed = ArticlesResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response for unread bookmarks: ${parsed.error.message}`,
		);
	}
	// ArticleSchemaの形式をBookmarkWithReadStatusSchemaの形式に変換
	const bookmarksWithReadStatus = parsed.data.bookmarks.map((bookmark) => ({
		id: bookmark.id,
		url: bookmark.url,
		title: bookmark.title,
		labels: bookmark.label ? [bookmark.label.name] : [],
		isRead: bookmark.isRead,
		isFavorite: bookmark.isFavorite ?? false,
		createdAt:
			typeof bookmark.createdAt === "string"
				? bookmark.createdAt
				: bookmark.createdAt.toISOString(),
		readAt: null,
		updatedAt:
			typeof bookmark.updatedAt === "string"
				? bookmark.updatedAt
				: bookmark.updatedAt.toISOString(),
	}));
	return bookmarksWithReadStatus;
}
/**
 * 既読のブックマークを取得します
 * @returns 既読のブックマークのリスト
 */
export async function getReadBookmarks() {
	// New endpoint for all read bookmarks
	const response = await fetch(`${getApiBaseUrl()}/api/bookmarks/read`);
	if (!response.ok) {
		throw new Error(`Failed to fetch read bookmarks: ${response.statusText}`);
	}

	const data = await response.json();
	const parsed = BookmarksListResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response for read bookmarks: ${parsed.error.message}`,
		);
	}
	return parsed.data.bookmarks;
}

/**
 * ブックマークを既読にマークします
 * @param bookmarkId - ブックマークID
 * @returns 処理結果
 */
export async function markBookmarkAsRead(bookmarkId: number) {
	const response = await fetch(
		`${getApiBaseUrl()}/api/bookmarks/${bookmarkId}/read`,
		{
			method: "PATCH",
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to mark bookmark ${bookmarkId} as read: ${response.statusText}`,
		);
	}

	const data = await response.json();
	const parsed = MarkAsReadResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response after marking bookmark as read: ${parsed.error.message}`,
		);
	}
	return parsed.data;
}

/**
 * 未使用ラベルをクリーンアップします
 * @returns クリーンアップの結果
 */
export async function cleanupUnusedLabels(): Promise<{
	deletedCount: number;
	deletedLabels: Array<{ id: number; name: string }>;
	message: string;
}> {
	const response = await fetch(`${getApiBaseUrl()}/api/labels/cleanup`, {
		method: "DELETE",
	});

	let data: unknown;
	try {
		data = await response.json();
	} catch (parseError: unknown) {
		const errorMessage =
			parseError instanceof Error ? parseError.message : String(parseError);
		if (!response.ok) {
			throw new Error(
				`Failed to cleanup unused labels. Status: ${response.status} ${response.statusText}`,
			);
		}
		throw new Error(
			`Unexpected response format when cleaning up labels: ${errorMessage}`,
		);
	}

	if (!response.ok) {
		let errorMessage = "Failed to cleanup unused labels";
		if (
			typeof data === "object" &&
			data !== null &&
			"message" in data &&
			typeof data.message === "string"
		) {
			errorMessage = data.message;
		}
		throw new Error(
			`${errorMessage}: ${response.statusText} (Status: ${response.status})`,
		);
	}

	const parsed = CleanupLabelsResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response after cleaning up labels. Zod errors: ${parsed.error.message}`,
		);
	}

	return {
		deletedCount: parsed.data.deletedCount,
		deletedLabels: parsed.data.deletedLabels,
		message: parsed.data.message,
	};
}
