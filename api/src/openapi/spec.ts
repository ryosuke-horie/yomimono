import type { OpenAPIObject, SchemaObject } from "openapi3-ts/oas30";

const timestampSchema: SchemaObject = {
	type: "string",
	format: "date-time",
	description: "ISO 8601 形式の日時",
};

const bookmarkSchema: SchemaObject = {
	type: "object",
	required: ["id", "url", "isRead", "createdAt", "updatedAt"],
	properties: {
		id: { type: "integer", format: "int64", example: 1 },
		url: { type: "string", format: "uri" },
		title: { type: "string", nullable: true },
		isRead: { type: "boolean" },
		createdAt: timestampSchema,
		updatedAt: timestampSchema,
	},
};

const openApiDocument: OpenAPIObject = {
	openapi: "3.1.0",
	info: {
		title: "Yomimono API",
		version: "0.1.0",
		description:
			"ブックマーク管理を行う Yomimono API の OpenAPI 定義。\nこのファイルは src/openapi/spec.ts を唯一のソースとして生成されます。",
	},
	servers: [
		{
			url: "http://localhost:8787",
			description: "ローカル開発（wrangler dev）",
		},
		{
			url: "https://api-yomimono.workers.dev",
			description: "本番 API",
		},
	],
	tags: [{ name: "Bookmarks", description: "ブックマーク関連の操作" }],
	paths: {
		"/api/bookmarks": {
			get: {
				tags: ["Bookmarks"],
				summary: "未読ブックマーク一覧",
				responses: {
					200: {
						description: "未読ブックマーク一覧",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/BookmarkListResponse",
								},
							},
						},
					},
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
		"/api/bookmarks/bulk": {
			post: {
				tags: ["Bookmarks"],
				summary: "ブックマーク一括登録",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/BulkBookmarksRequest" },
						},
					},
				},
				responses: {
					200: {
						description: "登録処理を実行",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/MessageResponse",
								},
							},
						},
					},
					400: { $ref: "#/components/responses/Error" },
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
		"/api/bookmarks/{id}/favorite": {
			post: {
				tags: ["Bookmarks"],
				summary: "お気に入り追加",
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "integer", format: "int64" },
					},
				],
				responses: {
					200: {
						description: "お気に入り登録完了",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/SuccessResponse" },
							},
						},
					},
					400: { $ref: "#/components/responses/Error" },
					404: { $ref: "#/components/responses/Error" },
					409: { $ref: "#/components/responses/Error" },
					500: { $ref: "#/components/responses/Error" },
				},
			},
			delete: {
				tags: ["Bookmarks"],
				summary: "お気に入り削除",
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "integer", format: "int64" },
					},
				],
				responses: {
					200: {
						description: "お気に入りから削除",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/SuccessResponse" },
							},
						},
					},
					400: { $ref: "#/components/responses/Error" },
					404: { $ref: "#/components/responses/Error" },
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
		"/api/bookmarks/favorites": {
			get: {
				tags: ["Bookmarks"],
				summary: "お気に入り一覧",
				responses: {
					200: {
						description: "お気に入りのブックマーク一覧",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/FavoriteBookmarksResponse",
								},
							},
						},
					},
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
		"/api/bookmarks/{id}/read": {
			patch: {
				tags: ["Bookmarks"],
				summary: "ブックマークを既読にする",
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "integer", format: "int64" },
					},
				],
				responses: {
					200: {
						description: "既読化完了",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/SuccessResponse" },
							},
						},
					},
					400: { $ref: "#/components/responses/Error" },
					404: { $ref: "#/components/responses/Error" },
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
		"/api/bookmarks/{id}/unread": {
			patch: {
				tags: ["Bookmarks"],
				summary: "ブックマークを未読に戻す",
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "integer", format: "int64" },
					},
				],
				responses: {
					200: {
						description: "未読へ戻した結果",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/SuccessResponse" },
							},
						},
					},
					400: { $ref: "#/components/responses/Error" },
					404: { $ref: "#/components/responses/Error" },
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
		"/api/bookmarks/recent": {
			get: {
				tags: ["Bookmarks"],
				summary: "最近既読にしたブックマーク",
				responses: {
					200: {
						description: "日付ごとにグルーピングされた既読履歴",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/RecentBookmarksResponse",
								},
							},
						},
					},
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
	},
	components: {
		schemas: {
			Bookmark: bookmarkSchema,
			BookmarkWithFavorite: {
				type: "object",
				required: [
					"id",
					"url",
					"isRead",
					"createdAt",
					"updatedAt",
					"isFavorite",
				],
				properties: {
					...bookmarkSchema.properties,
					isFavorite: { type: "boolean" },
				},
			},
			ErrorResponse: {
				type: "object",
				required: ["success", "message"],
				properties: {
					success: { type: "boolean", enum: [false] },
					message: { type: "string" },
				},
			},
			SuccessResponse: {
				type: "object",
				required: ["success"],
				properties: {
					success: { type: "boolean", enum: [true] },
				},
			},
			MessageResponse: {
				allOf: [
					{ $ref: "#/components/schemas/SuccessResponse" },
					{
						type: "object",
						required: ["message"],
						properties: { message: { type: "string" } },
					},
				],
			},
			BookmarkListResponse: {
				allOf: [
					{ $ref: "#/components/schemas/SuccessResponse" },
					{
						type: "object",
						required: ["bookmarks"],
						properties: {
							bookmarks: {
								type: "array",
								items: { $ref: "#/components/schemas/BookmarkWithFavorite" },
							},
							totalUnread: { type: "integer", format: "int64" },
							todayReadCount: { type: "integer", format: "int64" },
						},
					},
				],
			},
			FavoriteBookmarksResponse: {
				allOf: [
					{ $ref: "#/components/schemas/SuccessResponse" },
					{
						type: "object",
						required: ["bookmarks"],
						properties: {
							bookmarks: {
								type: "array",
								items: { $ref: "#/components/schemas/BookmarkWithFavorite" },
							},
							total: { type: "integer", format: "int64" },
						},
					},
				],
			},
			RecentBookmarksResponse: {
				allOf: [
					{ $ref: "#/components/schemas/SuccessResponse" },
					{
						type: "object",
						required: ["bookmarks"],
						properties: {
							bookmarks: {
								type: "object",
								additionalProperties: {
									type: "array",
									items: { $ref: "#/components/schemas/BookmarkWithFavorite" },
								},
								description: "YYYY-MM-DD をキーにした既読ブックマークリスト",
							},
						},
					},
				],
			},
			BulkBookmarksRequest: {
				type: "object",
				required: ["bookmarks"],
				properties: {
					bookmarks: {
						type: "array",
						minItems: 1,
						items: {
							type: "object",
							required: ["url", "title"],
							properties: {
								url: { type: "string", format: "uri" },
								title: { type: "string" },
							},
						},
					},
				},
			},
		},
		responses: {
			Error: {
				description: "エラーが発生した場合のレスポンス",
				content: {
					"application/json": {
						schema: { $ref: "#/components/schemas/ErrorResponse" },
					},
				},
			},
		},
	},
};

export default openApiDocument;
