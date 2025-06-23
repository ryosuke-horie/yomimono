/**
 * シードデータ管理API ルート
 * 開発環境でのテストデータ生成・管理エンドポイントを提供
 */
import { Hono } from "hono";
import {
	BadRequestError,
	createErrorResponse,
	createErrorResponseBody,
	InternalServerError,
	toContentfulStatusCode,
} from "../exceptions";
import type { ISeedService } from "../interfaces/service/seed";
import {
	validateNumber,
	validateOptionalBoolean,
	validateOptionalNumber,
	validateRequestBody,
} from "../utils/validation";

interface SeedRequestBody {
	bookmarkCount?: number;
	labelCount?: number;
	favoriteRatio?: number;
	forceRun?: boolean;
}

export const createSeedRouter = (seedService: ISeedService) => {
	const app = new Hono();

	// POST /api/dev/seed - シードデータ生成
	app.post("/", async (c) => {
		try {
			// リクエストボディの取得（オプション）
			let options: SeedRequestBody = {};
			const contentType = c.req.header("content-type");

			if (contentType?.includes("application/json")) {
				try {
					const body = await c.req.json();
					options = validateRequestBody(body) as SeedRequestBody;
				} catch (e) {
					// JSONパースエラーの場合はデフォルトオプションを使用
					options = {};
				}
			}

			// オプションのバリデーション
			const seedOptions = {
				bookmarkCount: validateOptionalNumber(
					options.bookmarkCount,
					"bookmarkCount",
					1,
					100,
				),
				labelCount: validateOptionalNumber(
					options.labelCount,
					"labelCount",
					1,
					20,
				),
				favoriteRatio: validateOptionalNumber(
					options.favoriteRatio,
					"favoriteRatio",
					0,
					1,
				),
				forceRun: validateOptionalBoolean(options.forceRun, "forceRun"),
			};

			// シードデータを生成
			const result = await seedService.generateSeedData(seedOptions);

			if (result.success) {
				return c.json({
					success: true,
					message: result.message,
					data: {
						generated: result.generated,
						executionTimeMs: result.executionTimeMs,
					},
				});
			}

			return c.json(
				{
					success: false,
					error: result.message,
				},
				500,
			);
		} catch (error) {
			console.error("シードデータ生成エンドポイントでエラーが発生:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	// POST /api/dev/seed/clear - データベースクリア
	app.post("/clear", async (c) => {
		try {
			const result = await seedService.clearAllData();

			if (result.success) {
				return c.json({
					success: true,
					message: result.message,
					data: {
						cleared: {
							bookmarks: Math.abs(result.generated.bookmarks),
							labels: Math.abs(result.generated.labels),
							articleLabels: Math.abs(result.generated.articleLabels),
							favorites: Math.abs(result.generated.favorites),
						},
						executionTimeMs: result.executionTimeMs,
					},
				});
			}

			return c.json(
				{
					success: false,
					error: result.message,
				},
				500,
			);
		} catch (error) {
			console.error("データベースクリアエンドポイントでエラーが発生:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	// GET /api/dev/seed/status - データベース状態取得
	app.get("/status", async (c) => {
		try {
			const status = await seedService.getDatabaseStatus();

			return c.json({
				success: true,
				data: status,
			});
		} catch (error) {
			console.error("データベース状態取得エンドポイントでエラーが発生:", error);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	// POST /api/dev/seed/custom - カスタムパラメータでシードデータ生成
	app.post("/custom", async (c) => {
		try {
			let body: {
				bookmarkCount?: number;
				labelCount?: number;
				favoriteRatio?: number;
				forceRun?: boolean;
			};

			try {
				body = await c.req.json();
			} catch (e) {
				throw new BadRequestError("Invalid JSON in request body");
			}

			validateRequestBody(body);

			// パラメータのバリデーション
			const customOptions = {
				bookmarkCount: body.bookmarkCount
					? validateNumber(body.bookmarkCount, "bookmarkCount", 1, 100)
					: undefined,
				labelCount: body.labelCount
					? validateNumber(body.labelCount, "labelCount", 1, 20)
					: undefined,
				favoriteRatio: body.favoriteRatio
					? validateNumber(body.favoriteRatio, "favoriteRatio", 0, 1)
					: undefined,
				forceRun: validateOptionalBoolean(body.forceRun, "forceRun"),
			};

			// シードデータを生成
			const result = await seedService.generateSeedData(customOptions);

			if (result.success) {
				return c.json({
					success: true,
					message: result.message,
					data: {
						options: customOptions,
						generated: result.generated,
						executionTimeMs: result.executionTimeMs,
					},
				});
			}

			return c.json(
				{
					success: false,
					error: result.message,
					options: customOptions,
				},
				500,
			);
		} catch (error) {
			console.error(
				"カスタムシードデータ生成エンドポイントでエラーが発生:",
				error,
			);
			const errorResponse = createErrorResponse(error);
			return c.json(
				createErrorResponseBody(error),
				toContentfulStatusCode(errorResponse.statusCode),
			);
		}
	});

	return app;
};

if (import.meta.vitest) {
	const { test, expect, describe, beforeEach, vi } = import.meta.vitest;

	// モックサービスの作成
	const mockSeedService = {
		generateSeedData: vi.fn(),
		clearAllData: vi.fn(),
		getDatabaseStatus: vi.fn(),
		validateEnvironment: vi.fn(),
	} as unknown as ISeedService;

	describe("Seed Routes", () => {
		let app: Hono;

		beforeEach(() => {
			app = createSeedRouter(mockSeedService);
			vi.clearAllMocks();
		});

		describe("POST /", () => {
			test("シードデータ生成が正常に実行される", async () => {
				const mockResult = {
					success: true,
					message: "シードデータの生成が完了しました",
					generated: {
						bookmarks: 25,
						labels: 6,
						articleLabels: 50,
						favorites: 8,
					},
					executionTimeMs: 1500,
				};

				vi.mocked(mockSeedService.generateSeedData).mockResolvedValue(
					mockResult,
				);

				const req = new Request("http://localhost/", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ bookmarkCount: 25, labelCount: 6 }),
				});

				const res = await app.fetch(req);
				const json = await res.json();

				expect(res.status).toBe(200);
				expect(json.success).toBe(true);
				expect(json.data.generated).toEqual(mockResult.generated);
				expect(mockSeedService.generateSeedData).toHaveBeenCalledWith({
					bookmarkCount: 25,
					labelCount: 6,
					favoriteRatio: undefined,
					forceRun: undefined,
				});
			});

			test("オプションなしでシードデータ生成が実行される", async () => {
				const mockResult = {
					success: true,
					message: "シードデータの生成が完了しました",
					generated: {
						bookmarks: 25,
						labels: 6,
						articleLabels: 50,
						favorites: 8,
					},
					executionTimeMs: 1200,
				};

				vi.mocked(mockSeedService.generateSeedData).mockResolvedValue(
					mockResult,
				);

				const req = new Request("http://localhost/", { method: "POST" });
				const res = await app.fetch(req);
				const json = await res.json();

				expect(res.status).toBe(200);
				expect(json.success).toBe(true);
				expect(mockSeedService.generateSeedData).toHaveBeenCalledWith({
					bookmarkCount: undefined,
					labelCount: undefined,
					favoriteRatio: undefined,
					forceRun: undefined,
				});
			});

			test("シードデータ生成が失敗した場合のエラーハンドリング", async () => {
				const mockResult = {
					success: false,
					message: "シードデータ生成に失敗しました: テストエラー",
					generated: {
						bookmarks: 0,
						labels: 0,
						articleLabels: 0,
						favorites: 0,
					},
					executionTimeMs: 100,
				};

				vi.mocked(mockSeedService.generateSeedData).mockResolvedValue(
					mockResult,
				);

				const req = new Request("http://localhost/", { method: "POST" });
				const res = await app.fetch(req);
				const json = await res.json();

				expect(res.status).toBe(500);
				expect(json.success).toBe(false);
				expect(json.error).toContain("シードデータ生成に失敗しました");
			});
		});

		describe("POST /clear", () => {
			test("データベースクリアが正常に実行される", async () => {
				const mockResult = {
					success: true,
					message: "データベースのクリアが完了しました",
					generated: {
						bookmarks: -10,
						labels: -5,
						articleLabels: -20,
						favorites: -3,
					},
					executionTimeMs: 800,
				};

				vi.mocked(mockSeedService.clearAllData).mockResolvedValue(mockResult);

				const req = new Request("http://localhost/clear", { method: "POST" });
				const res = await app.fetch(req);
				const json = await res.json();

				expect(res.status).toBe(200);
				expect(json.success).toBe(true);
				expect(json.data.cleared).toEqual({
					bookmarks: 10,
					labels: 5,
					articleLabels: 20,
					favorites: 3,
				});
				expect(mockSeedService.clearAllData).toHaveBeenCalled();
			});
		});

		describe("GET /status", () => {
			test("データベース状態が正常に取得される", async () => {
				const mockStatus = {
					bookmarkCount: 25,
					labelCount: 6,
					articleLabelCount: 50,
					favoriteCount: 8,
					unreadCount: 20,
					readCount: 5,
					lastUpdatedAt: "2024-01-01T00:00:00.000Z",
				};

				vi.mocked(mockSeedService.getDatabaseStatus).mockResolvedValue(
					mockStatus,
				);

				const req = new Request("http://localhost/status", { method: "GET" });
				const res = await app.fetch(req);
				const json = await res.json();

				expect(res.status).toBe(200);
				expect(json.success).toBe(true);
				expect(json.data).toEqual(mockStatus);
				expect(mockSeedService.getDatabaseStatus).toHaveBeenCalled();
			});
		});

		describe("POST /custom", () => {
			test("カスタムオプションでシードデータ生成が実行される", async () => {
				const mockResult = {
					success: true,
					message: "シードデータの生成が完了しました",
					generated: {
						bookmarks: 10,
						labels: 3,
						articleLabels: 20,
						favorites: 5,
					},
					executionTimeMs: 1000,
				};

				vi.mocked(mockSeedService.generateSeedData).mockResolvedValue(
					mockResult,
				);

				const customOptions = {
					bookmarkCount: 10,
					labelCount: 3,
					favoriteRatio: 0.5,
					forceRun: false,
				};

				const req = new Request("http://localhost/custom", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(customOptions),
				});

				const res = await app.fetch(req);
				const json = await res.json();

				expect(res.status).toBe(200);
				expect(json.success).toBe(true);
				expect(json.data.options).toEqual(customOptions);
				expect(json.data.generated).toEqual(mockResult.generated);
				expect(mockSeedService.generateSeedData).toHaveBeenCalledWith(
					customOptions,
				);
			});

			test("無効なJSONの場合はエラーが返される", async () => {
				const req = new Request("http://localhost/custom", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: "invalid json",
				});

				const res = await app.fetch(req);
				const json = await res.json();

				expect(res.status).toBe(400);
				expect(json.success).toBe(false);
			});

			test("範囲外の値が指定された場合はエラーが返される", async () => {
				const invalidOptions = {
					bookmarkCount: 200, // 最大値100を超過
					labelCount: 25, // 最大値20を超過
					favoriteRatio: 1.5, // 最大値1を超過
				};

				const req = new Request("http://localhost/custom", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(invalidOptions),
				});

				const res = await app.fetch(req);
				const json = await res.json();

				expect(res.status).toBe(400);
				expect(json.success).toBe(false);
			});
		});
	});
}
