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
	const { success, ...result } = parsed.data;
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
const BookmarkWithReadStatusSchema = z.object({
	id: z.number(),
	url: z.string(),
	title: z.string(),
	labels: z.array(z.string()),
	isRead: z.boolean(),
	isFavorite: z.boolean(),
	createdAt: z.string(),
	readAt: z.string().nullable(),
});

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
	const parsed = BookmarksListResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response for unread bookmarks: ${parsed.error.message}`,
		);
	}
	return parsed.data.bookmarks;
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

// --- 記事評価関連の型定義とスキーマ ---

export interface CreateRatingData {
	practicalValue: number;
	technicalDepth: number;
	understanding: number;
	novelty: number;
	importance: number;
	comment?: string;
}

export interface UpdateRatingData {
	practicalValue?: number;
	technicalDepth?: number;
	understanding?: number;
	novelty?: number;
	importance?: number;
	comment?: string;
}

const ArticleRatingSchema = z.object({
	id: z.number(),
	articleId: z.number(),
	practicalValue: z.number(),
	technicalDepth: z.number(),
	understanding: z.number(),
	novelty: z.number(),
	importance: z.number(),
	totalScore: z.number(),
	comment: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

const CreateRatingResponseSchema = z.object({
	success: z.literal(true),
	rating: ArticleRatingSchema,
});

const GetRatingResponseSchema = z.object({
	success: z.literal(true),
	rating: ArticleRatingSchema,
});

const UpdateRatingResponseSchema = z.object({
	success: z.literal(true),
	rating: ArticleRatingSchema,
});

// --- 記事評価関連のAPI関数 ---

/**
 * 記事の評価を作成する
 * @param articleId - 記事ID
 * @param ratingData - 評価データ
 * @returns 作成された評価オブジェクト
 */
export async function createArticleRating(
	articleId: number,
	ratingData: CreateRatingData,
) {
	const response = await fetch(
		`${getApiBaseUrl()}/api/bookmarks/${articleId}/rating`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(ratingData),
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to create rating for article ${articleId}: ${response.statusText}`,
		);
	}

	let data: unknown;
	try {
		data = await response.json();
	} catch (parseError: unknown) {
		const errorMessage =
			parseError instanceof Error ? parseError.message : String(parseError);
		throw new Error(
			`Failed to parse response when creating rating for article ${articleId}: ${errorMessage}`,
		);
	}

	const parsed = CreateRatingResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response after creating rating: ${parsed.error.message}`,
		);
	}

	return parsed.data.rating;
}

/**
 * 記事の評価を取得する
 * @param articleId - 記事ID
 * @returns 評価オブジェクト（存在しない場合はnull）
 */
export async function getArticleRating(articleId: number) {
	const response = await fetch(
		`${getApiBaseUrl()}/api/bookmarks/${articleId}/rating`,
	);

	if (response.status === 404) {
		return null; // 評価が存在しない場合
	}

	if (!response.ok) {
		throw new Error(
			`Failed to get rating for article ${articleId}: ${response.statusText}`,
		);
	}

	let data: unknown;
	try {
		data = await response.json();
	} catch (parseError: unknown) {
		const errorMessage =
			parseError instanceof Error ? parseError.message : String(parseError);
		throw new Error(
			`Failed to parse response when getting rating for article ${articleId}: ${errorMessage}`,
		);
	}

	const parsed = GetRatingResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response for rating ${articleId}: ${parsed.error.message}`,
		);
	}

	return parsed.data.rating;
}

/**
 * 記事の評価を更新する
 * @param articleId - 記事ID
 * @param updateData - 更新データ
 * @returns 更新された評価オブジェクト
 */
export async function updateArticleRating(
	articleId: number,
	updateData: UpdateRatingData,
) {
	const response = await fetch(
		`${getApiBaseUrl()}/api/bookmarks/${articleId}/rating`,
		{
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(updateData),
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to update rating for article ${articleId}: ${response.statusText}`,
		);
	}

	let data: unknown;
	try {
		data = await response.json();
	} catch (parseError: unknown) {
		const errorMessage =
			parseError instanceof Error ? parseError.message : String(parseError);
		throw new Error(
			`Failed to parse response when updating rating for article ${articleId}: ${errorMessage}`,
		);
	}

	const parsed = UpdateRatingResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response after updating rating: ${parsed.error.message}`,
		);
	}

	return parsed.data.rating;
}

/**
 * 記事の評価を削除する
 * @param articleId - 記事ID
 */
export async function deleteArticleRating(articleId: number): Promise<void> {
	const response = await fetch(
		`${getApiBaseUrl()}/api/bookmarks/${articleId}/rating`,
		{
			method: "DELETE",
		},
	);

	if (!response.ok) {
		throw new Error(
			`Failed to delete rating for article ${articleId}: ${response.statusText}`,
		);
	}
}

// --- Phase 2: 高度なMCP機能のための追加API関数 ---

export interface GetRatingsOptions {
	sortBy?:
		| "totalScore"
		| "createdAt"
		| "practicalValue"
		| "technicalDepth"
		| "understanding"
		| "novelty"
		| "importance";
	order?: "asc" | "desc";
	limit?: number;
	offset?: number;
	minScore?: number;
	maxScore?: number;
	hasComment?: boolean;
}

export interface RatingStats {
	totalRatings: number;
	averageScore: number;
	medianScore: number;
	dimensionAverages: {
		practicalValue: number;
		technicalDepth: number;
		understanding: number;
		novelty: number;
		importance: number;
	};
	scoreDistribution: Array<{
		range: string;
		count: number;
		percentage: number;
	}>;
	topRatedArticles: Array<{
		id: number;
		title: string;
		url: string;
		totalScore: number;
	}>;
}

export interface SearchRatingConditions {
	practicalValue?: { min?: number; max?: number };
	technicalDepth?: { min?: number; max?: number };
	totalScore?: { min?: number; max?: number };
	hasComment?: boolean;
	keywords?: string[];
}

export interface RatingWithArticle {
	rating: z.infer<typeof ArticleRatingSchema>;
	article: {
		id: number;
		title: string;
		url: string;
	};
}

const RatingsListResponseSchema = z.object({
	success: z.literal(true),
	ratings: z.array(ArticleRatingSchema),
	count: z.number(),
});

const RatingStatsResponseSchema = z.object({
	success: z.literal(true),
	stats: z.object({
		totalRatings: z.number(),
		averageScore: z.number(),
		medianScore: z.number(),
		dimensionAverages: z.object({
			practicalValue: z.number(),
			technicalDepth: z.number(),
			understanding: z.number(),
			novelty: z.number(),
			importance: z.number(),
		}),
		scoreDistribution: z.array(
			z.object({
				range: z.string(),
				count: z.number(),
				percentage: z.number(),
			}),
		),
		topRatedArticles: z.array(
			z.object({
				id: z.number(),
				title: z.string(),
				url: z.string(),
				totalScore: z.number(),
			}),
		),
	}),
});

/**
 * 評価一覧を取得する（フィルター・ソート対応）
 * @param options - 検索・ソートオプション
 * @returns 評価一覧
 */
export async function getArticleRatings(options: GetRatingsOptions = {}) {
	const queryParams = new URLSearchParams();

	if (options.sortBy) queryParams.append("sortBy", options.sortBy);
	if (options.order) queryParams.append("order", options.order);
	if (options.limit) queryParams.append("limit", options.limit.toString());
	if (options.offset) queryParams.append("offset", options.offset.toString());
	if (options.minScore)
		queryParams.append("minScore", options.minScore.toString());
	if (options.maxScore)
		queryParams.append("maxScore", options.maxScore.toString());
	if (options.hasComment !== undefined)
		queryParams.append("hasComment", options.hasComment.toString());

	const response = await fetch(
		`${getApiBaseUrl()}/api/ratings?${queryParams.toString()}`,
	);

	if (!response.ok) {
		throw new Error(`Failed to get article ratings: ${response.statusText}`);
	}

	let data: unknown;
	try {
		data = await response.json();
	} catch (parseError: unknown) {
		const errorMessage =
			parseError instanceof Error ? parseError.message : String(parseError);
		throw new Error(
			`Failed to parse response when getting article ratings: ${errorMessage}`,
		);
	}

	const parsed = RatingsListResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response for article ratings: ${parsed.error.message}`,
		);
	}

	return parsed.data.ratings;
}

/**
 * 評価統計情報を取得する
 * @returns 統計情報
 */
export async function getRatingStats(): Promise<RatingStats> {
	const response = await fetch(`${getApiBaseUrl()}/api/ratings/stats`);

	if (!response.ok) {
		throw new Error(`Failed to get rating stats: ${response.statusText}`);
	}

	let data: unknown;
	try {
		data = await response.json();
	} catch (parseError: unknown) {
		const errorMessage =
			parseError instanceof Error ? parseError.message : String(parseError);
		throw new Error(
			`Failed to parse response when getting rating stats: ${errorMessage}`,
		);
	}

	const parsed = RatingStatsResponseSchema.safeParse(data);
	if (!parsed.success) {
		throw new Error(
			`Invalid API response for rating stats: ${parsed.error.message}`,
		);
	}

	return parsed.data.stats;
}
