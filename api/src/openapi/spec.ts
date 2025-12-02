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

const labelSchema: SchemaObject = {
	type: "object",
	required: ["id", "name", "createdAt", "updatedAt"],
	properties: {
		id: { type: "integer", format: "int64", example: 1 },
		name: { type: "string", description: "正規化済みのラベル名" },
		description: { type: "string", nullable: true },
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
	tags: [
		{ name: "Bookmarks", description: "ブックマーク関連の操作" },
		{ name: "Labels", description: "ラベル関連の操作" },
	],
	paths: {
		"/api/bookmarks": {
			get: {
				tags: ["Bookmarks"],
				summary: "未読ブックマーク一覧",
				parameters: [
					{
						name: "label",
						in: "query",
						description: "ラベル名でのフィルタ（正規化済みの値）",
						schema: { type: "string" },
						required: false,
					},
				],
				responses: {
					200: {
						description: "未読またはラベルで絞ったブックマーク一覧",
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
		"/api/bookmarks/unlabeled": {
			get: {
				tags: ["Bookmarks"],
				summary: "未ラベルの未読ブックマーク一覧",
				responses: {
					200: {
						description: "未ラベルのブックマーク一覧",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UnlabeledBookmarksResponse",
								},
							},
						},
					},
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
		"/api/bookmarks/{id}/label": {
			put: {
				tags: ["Bookmarks"],
				summary: "ブックマークへラベルを付与",
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "integer", format: "int64" },
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/AssignLabelRequest" },
						},
					},
				},
				responses: {
					200: {
						description: "付与したラベルを返却",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/AssignLabelResponse",
								},
							},
						},
					},
					400: { $ref: "#/components/responses/Error" },
					404: { $ref: "#/components/responses/Error" },
					409: { $ref: "#/components/responses/Error" },
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
		"/api/bookmarks/unrated": {
			get: {
				tags: ["Bookmarks"],
				summary: "未評価のブックマーク一覧",
				responses: {
					200: {
						description: "未評価のブックマーク一覧",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UnratedBookmarksResponse",
								},
							},
						},
					},
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
		"/api/bookmarks/batch-label": {
			put: {
				tags: ["Bookmarks"],
				summary: "複数記事にまとめてラベル付け",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/BatchLabelRequest" },
						},
					},
				},
				responses: {
					200: {
						description: "ラベル付け結果",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/BatchLabelResponse",
								},
							},
						},
					},
					400: { $ref: "#/components/responses/Error" },
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
		"/api/labels": {
			get: {
				tags: ["Labels"],
				summary: "ラベル一覧",
				responses: {
					200: {
						description: "ラベルと件数の一覧",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/LabelsResponse" },
							},
						},
					},
					500: { $ref: "#/components/responses/Error" },
				},
			},
			post: {
				tags: ["Labels"],
				summary: "ラベル作成",
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/CreateLabelRequest" },
						},
					},
				},
				responses: {
					201: {
						description: "作成したラベル",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/LabelResponse" },
							},
						},
					},
					400: { $ref: "#/components/responses/Error" },
					409: { $ref: "#/components/responses/Error" },
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
		"/api/labels/cleanup": {
			delete: {
				tags: ["Labels"],
				summary: "未使用ラベルの一括削除",
				responses: {
					200: {
						description: "削除件数を返却",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/LabelCleanupResponse",
								},
							},
						},
					},
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
		"/api/labels/{id}": {
			get: {
				tags: ["Labels"],
				summary: "ID でラベル取得",
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
						description: "対象ラベル",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/LabelResponse" },
							},
						},
					},
					400: { $ref: "#/components/responses/Error" },
					404: { $ref: "#/components/responses/Error" },
					500: { $ref: "#/components/responses/Error" },
				},
			},
			patch: {
				tags: ["Labels"],
				summary: "ラベル説明文の更新",
				parameters: [
					{
						name: "id",
						in: "path",
						required: true,
						schema: { type: "integer", format: "int64" },
					},
				],
				requestBody: {
					required: true,
					content: {
						"application/json": {
							schema: { $ref: "#/components/schemas/UpdateLabelRequest" },
						},
					},
				},
				responses: {
					200: {
						description: "更新後のラベル",
						content: {
							"application/json": {
								schema: { $ref: "#/components/schemas/LabelResponse" },
							},
						},
					},
					400: { $ref: "#/components/responses/Error" },
					404: { $ref: "#/components/responses/Error" },
					500: { $ref: "#/components/responses/Error" },
				},
			},
			delete: {
				tags: ["Labels"],
				summary: "ラベル削除",
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
						description: "削除完了メッセージ",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/MessageResponse",
								},
							},
						},
					},
					400: { $ref: "#/components/responses/Error" },
					404: { $ref: "#/components/responses/Error" },
					500: { $ref: "#/components/responses/Error" },
				},
			},
		},
	},
	components: {
		schemas: {
			Bookmark: bookmarkSchema,
			BookmarkWithLabel: {
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
					label: {
						allOf: [{ $ref: "#/components/schemas/Label" }],
						nullable: true,
					},
				},
			},
			Label: labelSchema,
			LabelWithCount: {
				allOf: [
					{ $ref: "#/components/schemas/Label" },
					{
						type: "object",
						required: ["articleCount"],
						properties: {
							articleCount: { type: "integer", format: "int64" },
						},
					},
				],
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
								items: { $ref: "#/components/schemas/BookmarkWithLabel" },
							},
							totalUnread: { type: "integer", format: "int64" },
							todayReadCount: { type: "integer", format: "int64" },
						},
					},
				],
			},
			UnlabeledBookmarksResponse: {
				allOf: [
					{ $ref: "#/components/schemas/SuccessResponse" },
					{
						type: "object",
						required: ["bookmarks"],
						properties: {
							bookmarks: {
								type: "array",
								items: { $ref: "#/components/schemas/Bookmark" },
							},
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
								items: { $ref: "#/components/schemas/BookmarkWithLabel" },
							},
							total: { type: "integer", format: "int64" },
						},
					},
				],
			},
			UnratedBookmarksResponse: {
				allOf: [
					{ $ref: "#/components/schemas/SuccessResponse" },
					{
						type: "object",
						required: ["bookmarks"],
						properties: {
							bookmarks: {
								type: "array",
								items: { $ref: "#/components/schemas/BookmarkWithLabel" },
							},
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
									items: { $ref: "#/components/schemas/BookmarkWithLabel" },
								},
								description: "YYYY-MM-DD をキーにした既読ブックマークリスト",
							},
						},
					},
				],
			},
			AssignLabelRequest: {
				type: "object",
				required: ["labelName"],
				properties: {
					labelName: { type: "string", description: "付与するラベル名" },
				},
			},
			AssignLabelResponse: {
				allOf: [
					{ $ref: "#/components/schemas/SuccessResponse" },
					{
						type: "object",
						required: ["label"],
						properties: {
							label: { $ref: "#/components/schemas/Label" },
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
			BatchLabelRequest: {
				type: "object",
				required: ["articleIds", "labelName"],
				properties: {
					articleIds: {
						type: "array",
						minItems: 1,
						items: { type: "integer", format: "int64" },
					},
					labelName: { type: "string" },
					description: { type: "string", nullable: true },
				},
			},
			BatchLabelResponse: {
				allOf: [
					{ $ref: "#/components/schemas/SuccessResponse" },
					{
						type: "object",
						required: ["successful", "skipped", "errors", "label"],
						properties: {
							successful: { type: "integer", format: "int32" },
							skipped: { type: "integer", format: "int32" },
							errors: {
								type: "array",
								items: {
									type: "object",
									required: ["articleId", "error"],
									properties: {
										articleId: { type: "integer", format: "int64" },
										error: { type: "string" },
									},
								},
							},
							label: { $ref: "#/components/schemas/Label" },
						},
					},
				],
			},
			CreateLabelRequest: {
				type: "object",
				required: ["name"],
				properties: {
					name: { type: "string" },
					description: { type: "string", nullable: true },
				},
			},
			UpdateLabelRequest: {
				type: "object",
				required: ["description"],
				properties: {
					description: { type: "string", nullable: true },
				},
			},
			LabelResponse: {
				allOf: [
					{ $ref: "#/components/schemas/SuccessResponse" },
					{
						type: "object",
						required: ["label"],
						properties: {
							label: { $ref: "#/components/schemas/Label" },
						},
					},
				],
			},
			LabelsResponse: {
				allOf: [
					{ $ref: "#/components/schemas/SuccessResponse" },
					{
						type: "object",
						required: ["labels"],
						properties: {
							labels: {
								type: "array",
								items: { $ref: "#/components/schemas/LabelWithCount" },
							},
						},
					},
				],
			},
			LabelCleanupResponse: {
				allOf: [
					{ $ref: "#/components/schemas/MessageResponse" },
					{
						type: "object",
						required: ["deletedCount", "deletedLabels"],
						properties: {
							deletedCount: { type: "integer", format: "int32" },
							deletedLabels: {
								type: "array",
								items: { $ref: "#/components/schemas/Label" },
							},
						},
					},
				],
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
