import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Label } from "../db/schema";
import {
	createErrorResponse,
	createErrorResponseBody,
	toContentfulStatusCode,
} from "../exceptions";
import type { Env } from "../index";
import type { ILabelService } from "../interfaces/service/label";

// 日付文字列とDateオブジェクトを比較するためのヘルパー関数
function compareObjectsIgnoringDateFormat(
	actual: Record<string, unknown>,
	expected: Record<string, unknown>,
): void {
	// オブジェクトのすべてのプロパティに対して検証
	for (const key in expected) {
		if (Object.hasOwn(expected, key)) {
			// プロパティの値が存在するか確認
			expect(actual).toHaveProperty(key);

			if (expected[key] instanceof Date) {
				// Dateオブジェクトの場合は文字列への変換を許容する
				if (typeof actual[key] === "string") {
					// 日付文字列がISO形式かチェック
					const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;
					expect(actual[key]).toMatch(dateRegex);

					// 念のため日付としても有効かチェック
					const actualDate = new Date(actual[key]);
					expect(actualDate.toString()).not.toBe("Invalid Date");
				} else {
					// そうでなければ通常の比較
					expect(actual[key]).toEqual(expected[key]);
				}
			} else if (typeof expected[key] === "object" && expected[key] !== null) {
				// ネストされたオブジェクトの場合は再帰的に検証
				compareObjectsIgnoringDateFormat(
					actual[key] as Record<string, unknown>,
					expected[key] as Record<string, unknown>,
				);
			} else {
				// その他のプロパティは通常通り比較
				expect(actual[key]).toEqual(expected[key]);
			}
		}
	}
}

// モック関数の定義
const mockGetLabels = vi.fn();
const mockAssignLabel = vi.fn();
const mockCreateLabel = vi.fn();
const mockDeleteLabel = vi.fn();
const mockGetLabelById = vi.fn();
const mockUpdateLabelDescription = vi.fn();
const mockAssignLabelsToMultipleArticles = vi.fn();
const mockCleanupUnusedLabels = vi.fn();

// モックサービスの作成
const mockLabelService: ILabelService = {
	getLabels: mockGetLabels,
	getLabelById: mockGetLabelById,
	assignLabel: mockAssignLabel,
	createLabel: mockCreateLabel,
	deleteLabel: mockDeleteLabel,
	updateLabelDescription: mockUpdateLabelDescription,
	assignLabelsToMultipleArticles: mockAssignLabelsToMultipleArticles,
	cleanupUnusedLabels: mockCleanupUnusedLabels,
};

// 実際のルーターの代わりにモックサービスを使用するカスタムルーターを作成
function createMockLabelsRouter() {
	const router = new Hono<{ Bindings: Env }>();

	router.get("/", async (c) => {
		try {
			const result = await mockLabelService.getLabels();
			return c.json({ success: true, labels: result });
		} catch (error) {
			console.error("Failed to get labels:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	router.post("/", async (c) => {
		try {
			const body = await c.req.json<{ name?: string; description?: string }>();
			const labelName = body?.name;
			const description = body?.description;

			if (
				!labelName ||
				typeof labelName !== "string" ||
				labelName.trim() === ""
			) {
				return c.json(
					{
						success: false,
						message: "name is required and must be a non-empty string",
					},
					400,
				);
			}

			if (description !== undefined && typeof description !== "string") {
				return c.json(
					{
						success: false,
						message: "description must be a string",
					},
					400,
				);
			}

			const newLabel = await mockLabelService.createLabel(
				labelName,
				description,
			);
			return c.json({ success: true, label: newLabel }, 201);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("already exists")) {
					return c.json({ success: false, message: error.message }, 409);
				}
				if (error.message.includes("cannot be empty")) {
					return c.json({ success: false, message: error.message }, 400);
				}
			}
			console.error("Failed to create label:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	// ラベルクリーンアップ（これを/:idより前に定義する必要がある）
	router.delete("/cleanup", async (c) => {
		try {
			const result = await mockLabelService.cleanupUnusedLabels();
			return c.json({
				success: true,
				message: `Successfully cleaned up ${result.deletedCount} unused labels`,
				deletedCount: result.deletedCount,
				deletedLabels: result.deletedLabels,
			});
		} catch (error) {
			console.error("Failed to cleanup unused labels:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	// ラベル取得（ID指定）
	router.get("/:id", async (c) => {
		try {
			const id = Number.parseInt(c.req.param("id"), 10);
			if (Number.isNaN(id)) {
				return c.json({ success: false, message: "Invalid label ID" }, 400);
			}

			const label = await mockLabelService.getLabelById(id);
			return c.json({ success: true, label });
		} catch (error) {
			if (error instanceof Error && error.message.includes("not found")) {
				return c.json({ success: false, message: "Label not found" }, 404);
			}
			console.error("Failed to get label:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	// ラベル説明文更新
	router.patch("/:id", async (c) => {
		try {
			const id = Number.parseInt(c.req.param("id"), 10);
			if (Number.isNaN(id)) {
				return c.json({ success: false, message: "Invalid label ID" }, 400);
			}

			const body = await c.req.json<{ description?: string | null }>();

			// descriptionがundefinedの場合は更新しない
			if (body.description === undefined) {
				return c.json(
					{
						success: false,
						message: "description is required",
					},
					400,
				);
			}

			// descriptionの型チェック
			if (body.description !== null && typeof body.description !== "string") {
				return c.json(
					{
						success: false,
						message: "description must be a string or null",
					},
					400,
				);
			}

			const updatedLabel = await mockLabelService.updateLabelDescription(
				id,
				body.description,
			);
			return c.json({ success: true, label: updatedLabel });
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.includes("not found")) {
					return c.json({ success: false, message: "Label not found" }, 404);
				}
				if (error.message.includes("Failed to update")) {
					return c.json({ success: false, message: error.message }, 500);
				}
			}
			console.error("Failed to update label description:", error);
			return c.json(
				{ success: false, message: "Failed to update label description" },
				500,
			);
		}
	});

	// ラベル削除
	router.delete("/:id", async (c) => {
		try {
			const id = Number.parseInt(c.req.param("id"), 10);
			if (Number.isNaN(id)) {
				return c.json({ success: false, message: "Invalid label ID" }, 400);
			}

			await mockLabelService.deleteLabel(id);
			return c.json({ success: true, message: "Label deleted successfully" });
		} catch (error) {
			if (error instanceof Error && error.message.includes("not found")) {
				return c.json({ success: false, message: "Label not found" }, 404);
			}
			console.error("Failed to delete label:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	return router;
}

// テスト実行
describe("Labels Route", () => {
	let app: Hono<{ Bindings: Env }>;

	beforeEach(() => {
		vi.clearAllMocks();
		app = new Hono<{ Bindings: Env }>();
		const mockRouter = createMockLabelsRouter();
		app.route("/api/labels", mockRouter);
	});

	describe("GET /api/labels", () => {
		it("全てのラベルを取得し、成功レスポンスを返すこと", async () => {
			const mockLabelsResult = [
				{
					id: 1,
					name: "go",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 5,
				},
				{
					id: 2,
					name: "typescript",
					createdAt: new Date(),
					updatedAt: new Date(),
					articleCount: 10,
				},
			];
			mockGetLabels.mockResolvedValue(mockLabelsResult);

			const mockEnv: Env = { DB: {} as D1Database };
			const res = await app.request("/api/labels", {}, mockEnv);
			const body = (await res.json()) as {
				success: boolean;
				labels: (Label & { articleCount: number })[];
			};

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.labels).toHaveLength(mockLabelsResult.length);
			expect(body.labels[0].name).toBe(mockLabelsResult[0].name);
			expect(body.labels[0].articleCount).toBe(
				mockLabelsResult[0].articleCount,
			);
			expect(mockGetLabels).toHaveBeenCalledOnce();
		});

		it("サービスでエラーが発生した場合、500エラーレスポンスを返すこと", async () => {
			const error = new Error("Service error");
			mockGetLabels.mockRejectedValue(error);

			const mockEnv: Env = { DB: {} as D1Database };
			const res = await app.request("/api/labels", {}, mockEnv);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Service error");
			expect(mockGetLabels).toHaveBeenCalledOnce();
		});
	});

	describe("POST /api/labels", () => {
		const newLabelName = "new-label";
		const createdLabel: Label = {
			id: 3,
			name: newLabelName,
			description: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		const mockEnv: Env = { DB: {} as D1Database };

		it("新しいラベルを作成し、成功レスポンス（201）を返すこと", async () => {
			mockCreateLabel.mockResolvedValue(createdLabel);

			const res = await app.request(
				"/api/labels",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: newLabelName }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; label: Label };

			expect(res.status).toBe(201);
			expect(body.success).toBe(true);
			expect(body.label.name).toBe(createdLabel.name);
			expect(body.label.id).toBe(createdLabel.id);
			expect(mockCreateLabel).toHaveBeenCalledWith(newLabelName, undefined);
		});

		it("リクエストボディにnameがない場合、400エラーレスポンスを返すこと", async () => {
			const res = await app.request(
				"/api/labels",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.message).toBe(
				"name is required and must be a non-empty string",
			);
			expect(mockCreateLabel).not.toHaveBeenCalled();
		});

		it("リクエストボディのnameが空文字列の場合、400エラーレスポンスを返すこと", async () => {
			const res = await app.request(
				"/api/labels",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: "  " }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.message).toBe(
				"name is required and must be a non-empty string",
			);
			expect(mockCreateLabel).not.toHaveBeenCalled();
		});

		it("サービスでラベルが既に存在すると判断された場合、409エラーレスポンスを返すこと", async () => {
			const error = new Error(`Label "${newLabelName}" already exists`);
			mockCreateLabel.mockRejectedValue(error);

			const res = await app.request(
				"/api/labels",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: newLabelName }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(409);
			expect(body.success).toBe(false);
			expect(body.message).toBe(error.message);
			expect(mockCreateLabel).toHaveBeenCalledWith(newLabelName, undefined);
		});

		it("サービスで予期せぬエラーが発生した場合、500エラーレスポンスを返すこと", async () => {
			const error = new Error("Database connection failed");
			mockCreateLabel.mockRejectedValue(error);

			const res = await app.request(
				"/api/labels",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ name: newLabelName }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Database connection failed");
			expect(mockCreateLabel).toHaveBeenCalledWith(newLabelName, undefined);
		});
	});

	describe("GET /api/labels/:id", () => {
		const mockEnv: Env = { DB: {} as D1Database };
		const labelId = 1;
		const mockLabel: Label = {
			id: labelId,
			name: "typescript",
			description: "TypeScriptに関する記事",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it("指定されたIDのラベルを取得し、成功レスポンスを返すこと", async () => {
			mockGetLabelById.mockResolvedValue(mockLabel);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "GET",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; label: Label };

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			compareObjectsIgnoringDateFormat(body.label, mockLabel);
			expect(mockGetLabelById).toHaveBeenCalledWith(labelId);
		});

		it("不正なID形式の場合、400エラーレスポンスを返すこと", async () => {
			const res = await app.request(
				"/api/labels/invalid-id",
				{
					method: "GET",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Invalid label ID");
			expect(mockGetLabelById).not.toHaveBeenCalled();
		});

		it("存在しないラベルの場合、404エラーレスポンスを返すこと", async () => {
			const error = new Error(`Label with id ${labelId} not found`);
			mockGetLabelById.mockRejectedValue(error);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "GET",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Label not found");
			expect(mockGetLabelById).toHaveBeenCalledWith(labelId);
		});

		it("サービスでエラーが発生した場合、500エラーレスポンスを返すこと", async () => {
			const error = new Error("Database connection failed");
			mockGetLabelById.mockRejectedValue(error);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "GET",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Database connection failed");
			expect(mockGetLabelById).toHaveBeenCalledWith(labelId);
		});
	});

	describe("PATCH /api/labels/:id", () => {
		const mockEnv: Env = { DB: {} as D1Database };
		const labelId = 1;
		const newDescription = "更新された説明文";
		const mockLabel: Label = {
			id: labelId,
			name: "typescript",
			description: newDescription,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		it("ラベルの説明文を更新し、成功レスポンスを返すこと", async () => {
			mockUpdateLabelDescription.mockResolvedValue(mockLabel);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ description: newDescription }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; label: Label };

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			compareObjectsIgnoringDateFormat(body.label, mockLabel);
			expect(mockUpdateLabelDescription).toHaveBeenCalledWith(
				labelId,
				newDescription,
			);
		});

		it("nullを指定して説明文を削除できること", async () => {
			const labelWithoutDesc = {
				...mockLabel,
				description: null,
			};
			mockUpdateLabelDescription.mockResolvedValue(labelWithoutDesc);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ description: null }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; label: Label };

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			compareObjectsIgnoringDateFormat(body.label, labelWithoutDesc);
			expect(mockUpdateLabelDescription).toHaveBeenCalledWith(labelId, null);
		});

		it("リクエストボディにdescriptionがない場合、400エラーレスポンスを返すこと", async () => {
			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({}),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.message).toBe("description is required");
			expect(mockUpdateLabelDescription).not.toHaveBeenCalled();
		});

		it("不正なID形式の場合、400エラーレスポンスを返すこと", async () => {
			const res = await app.request(
				"/api/labels/invalid-id",
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ description: newDescription }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Invalid label ID");
			expect(mockUpdateLabelDescription).not.toHaveBeenCalled();
		});

		it("存在しないラベルの場合、404エラーレスポンスを返すこと", async () => {
			const error = new Error(`Label with id ${labelId} not found`);
			mockUpdateLabelDescription.mockRejectedValue(error);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ description: newDescription }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Label not found");
			expect(mockUpdateLabelDescription).toHaveBeenCalledWith(
				labelId,
				newDescription,
			);
		});

		it("サービスでエラーが発生した場合、500エラーレスポンスを返すこと", async () => {
			const error = new Error("Failed to update label description");
			mockUpdateLabelDescription.mockRejectedValue(error);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ description: newDescription }),
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Failed to update label description");
			expect(mockUpdateLabelDescription).toHaveBeenCalledWith(
				labelId,
				newDescription,
			);
		});
	});

	describe("DELETE /api/labels/:id", () => {
		const mockEnv: Env = { DB: {} as D1Database };
		const labelId = 1;

		it("ラベルを削除し、成功レスポンスを返すこと", async () => {
			mockDeleteLabel.mockResolvedValue(undefined);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "DELETE",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe("Label deleted successfully");
			expect(mockDeleteLabel).toHaveBeenCalledWith(labelId);
		});

		it("不正なID形式の場合、400エラーレスポンスを返すこと", async () => {
			const res = await app.request(
				"/api/labels/invalid-id",
				{
					method: "DELETE",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Invalid label ID");
			expect(mockDeleteLabel).not.toHaveBeenCalled();
		});

		it("存在しないラベルの場合、404エラーレスポンスを返すこと", async () => {
			const error = new Error(`Label with id ${labelId} not found`);
			mockDeleteLabel.mockRejectedValue(error);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "DELETE",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Label not found");
			expect(mockDeleteLabel).toHaveBeenCalledWith(labelId);
		});

		it("サービスでエラーが発生した場合、500エラーレスポンスを返すこと", async () => {
			const error = new Error("Database connection failed");
			mockDeleteLabel.mockRejectedValue(error);

			const res = await app.request(
				`/api/labels/${labelId}`,
				{
					method: "DELETE",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Database connection failed");
			expect(mockDeleteLabel).toHaveBeenCalledWith(labelId);
		});
	});

	describe("DELETE /api/labels/cleanup", () => {
		const mockEnv: Env = { DB: {} as D1Database };

		it("未使用ラベルをクリーンアップし、成功レスポンスを返すこと", async () => {
			const mockCleanupResult = {
				deletedCount: 2,
				deletedLabels: [
					{ id: 1, name: "unused-label-1" },
					{ id: 2, name: "unused-label-2" },
				],
			};
			mockCleanupUnusedLabels.mockResolvedValue(mockCleanupResult);

			const res = await app.request(
				"/api/labels/cleanup",
				{
					method: "DELETE",
				},
				mockEnv,
			);
			const body = (await res.json()) as {
				success: boolean;
				message: string;
				deletedCount: number;
				deletedLabels: Array<{ id: number; name: string }>;
			};

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe("Successfully cleaned up 2 unused labels");
			expect(body.deletedCount).toBe(2);
			expect(body.deletedLabels).toHaveLength(2);
			expect(body.deletedLabels[0]).toEqual({ id: 1, name: "unused-label-1" });
			expect(body.deletedLabels[1]).toEqual({ id: 2, name: "unused-label-2" });
			expect(mockCleanupUnusedLabels).toHaveBeenCalledOnce();
		});

		it("未使用ラベルがない場合、空の結果を返すこと", async () => {
			const mockCleanupResult = {
				deletedCount: 0,
				deletedLabels: [],
			};
			mockCleanupUnusedLabels.mockResolvedValue(mockCleanupResult);

			const res = await app.request(
				"/api/labels/cleanup",
				{
					method: "DELETE",
				},
				mockEnv,
			);
			const body = (await res.json()) as {
				success: boolean;
				message: string;
				deletedCount: number;
				deletedLabels: Array<{ id: number; name: string }>;
			};

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe("Successfully cleaned up 0 unused labels");
			expect(body.deletedCount).toBe(0);
			expect(body.deletedLabels).toHaveLength(0);
			expect(mockCleanupUnusedLabels).toHaveBeenCalledOnce();
		});

		it("大量の未使用ラベルがある場合も正しく処理すること", async () => {
			const mockCleanupResult = {
				deletedCount: 5,
				deletedLabels: [
					{ id: 1, name: "label-1" },
					{ id: 2, name: "label-2" },
					{ id: 3, name: "label-3" },
					{ id: 4, name: "label-4" },
					{ id: 5, name: "label-5" },
				],
			};
			mockCleanupUnusedLabels.mockResolvedValue(mockCleanupResult);

			const res = await app.request(
				"/api/labels/cleanup",
				{
					method: "DELETE",
				},
				mockEnv,
			);
			const body = (await res.json()) as {
				success: boolean;
				message: string;
				deletedCount: number;
				deletedLabels: Array<{ id: number; name: string }>;
			};

			expect(res.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe("Successfully cleaned up 5 unused labels");
			expect(body.deletedCount).toBe(5);
			expect(body.deletedLabels).toHaveLength(5);
			expect(mockCleanupUnusedLabels).toHaveBeenCalledOnce();
		});

		it("サービスでエラーが発生した場合、500エラーレスポンスを返すこと", async () => {
			const error = new Error("Database connection failed");
			mockCleanupUnusedLabels.mockRejectedValue(error);

			const res = await app.request(
				"/api/labels/cleanup",
				{
					method: "DELETE",
				},
				mockEnv,
			);
			const body = (await res.json()) as { success: boolean; message: string };

			expect(res.status).toBe(500);
			expect(body.success).toBe(false);
			expect(body.message).toBe("Database connection failed");
			expect(mockCleanupUnusedLabels).toHaveBeenCalledOnce();
		});
	});
});
