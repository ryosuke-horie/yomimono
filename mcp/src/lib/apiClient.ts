import { z } from "zod";

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

// Schema for the GET /api/labels/:id response
const GetLabelByIdResponseSchema = z.object({
	success: z.literal(true),
	label: LabelSchema,
});

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

// Get API base URL from environment variable
function getApiBaseUrl(): string {
	const API_BASE_URL = process.env.API_BASE_URL;
	if (!API_BASE_URL) {
		throw new Error("API_BASE_URL environment variable is not set.");
	}
	return API_BASE_URL;
}

function buildUrl(path: string): string {
	return `${getApiBaseUrl()}${path}`;
}

function extractErrorMessage(data: unknown): string | undefined {
	if (typeof data === "object" && data !== null) {
		if ("message" in data && typeof (data as { message: unknown }).message === "string") {
			return (data as { message: string }).message;
		}
		if ("error" in data && typeof (data as { error: unknown }).error === "string") {
			return (data as { error: string }).error;
		}
	}
	if (typeof data === "string" && data.trim().length > 0) {
		return data;
	}
	return undefined;
}
async function requestJson<T>(
	path: string,
	init: RequestInit | undefined,
	schema: z.ZodType<T>,
	errorMessage: string,
): Promise<T> {
	const response = await fetch(buildUrl(path), init);
	let data: unknown;
	let parseError: unknown;

	if (response.status !== 204) {
		try {
			data = await response.json();
		} catch (error: unknown) {
			parseError = error;
		}
	}

	if (!response.ok) {
		if (parseError) {
			const parseMessage = parseError instanceof Error ? parseError.message : String(parseError);
			throw new Error(`${errorMessage}: ${response.statusText} (failed to parse error body: ${parseMessage})`);
		}
		const detailedMessage = extractErrorMessage(data) ?? `${response.status} ${response.statusText}`;
		throw new Error(`${errorMessage}: ${detailedMessage}`);
	}

	if (parseError) {
		const parseMessage = parseError instanceof Error ? parseError.message : String(parseError);
		throw new Error(`${errorMessage}: Failed to parse response JSON: ${parseMessage}`);
	}

	const parsed = schema.safeParse(data);
	if (!parsed.success) {
		throw new Error(`${errorMessage}: ${parsed.error.message}`);
	}
	return parsed.data;
}

async function requestVoid(path: string, init: RequestInit | undefined, errorMessage: string): Promise<void> {
	const response = await fetch(buildUrl(path), init);
	if (response.ok) {
		return;
	}

	let data: unknown;
	try {
		if (response.status !== 204) {
			data = await response.json();
		}
	} catch (error: unknown) {
		const parseMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`${errorMessage}: ${response.statusText} (failed to parse error body: ${parseMessage})`);
	}

	const detailedMessage = extractErrorMessage(data) ?? `${response.status} ${response.statusText}`;
	throw new Error(`${errorMessage}: ${detailedMessage}`);
}

export async function getUnlabeledArticles() {
	const data = await requestJson(
		"/api/bookmarks/unlabeled",
		undefined,
		UnlabeledArticlesResponseSchema,
		"Failed to fetch unlabeled articles",
	);

	return data.bookmarks.map((bookmark) => ({
		...bookmark,
		label: null,
		isFavorite: false,
	}));
}

export async function getLabels() {
	const data = await requestJson("/api/labels", undefined, LabelsResponseSchema, "Failed to fetch labels");
	return data.labels;
}

export async function assignLabelToArticle(articleId: number, labelName: string, description?: string) {
	await requestVoid(
		`/api/bookmarks/${articleId}/label`,
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
		`Failed to assign label "${labelName}" to article ${articleId}`,
	);
}

export async function getLabelById(id: number) {
	const data = await requestJson(
		`/api/labels/${id}`,
		undefined,
		GetLabelByIdResponseSchema,
		`Failed to fetch label with ID ${id}`,
	);
	return data.label;
}

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
	const data = await requestJson(
		"/api/bookmarks/batch-label",
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				articleIds,
				labelName,
				description,
			}),
		},
		BatchResultSchema,
		`Failed to batch assign label "${labelName}"`,
	);

	// デバッグ用：レスポンスをstderrに出力
	console.error("Batch label assignment response:", JSON.stringify(data, null, 2));

	return {
		successful: data.successful,
		skipped: data.skipped,
		errors: data.errors,
		label: data.label,
	};
}

export async function getUnreadBookmarks() {
	const data = await requestJson(
		"/api/bookmarks",
		undefined,
		ArticlesResponseSchema,
		"Failed to fetch unread bookmarks",
	);
	return data.bookmarks.map((bookmark) => ({
		id: bookmark.id,
		url: bookmark.url,
		title: bookmark.title,
		labels: bookmark.label ? [bookmark.label.name] : [],
		isRead: bookmark.isRead,
		isFavorite: bookmark.isFavorite ?? false,
		createdAt: typeof bookmark.createdAt === "string" ? bookmark.createdAt : bookmark.createdAt.toISOString(),
		readAt: null,
		updatedAt: typeof bookmark.updatedAt === "string" ? bookmark.updatedAt : bookmark.updatedAt.toISOString(),
	}));
}
