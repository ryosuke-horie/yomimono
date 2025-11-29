import type { Hono } from "hono";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ISeedService } from "../interfaces/service/seed";
import { createSeedRouter } from "./seed";

interface SeedResponse {
	success: boolean;
	message?: string;
	error?: string;
	data?: {
		generated?: {
			bookmarks: number;
			labels: number;
			articleLabels: number;
			favorites: number;
		};
		cleared?: {
			bookmarks: number;
			labels: number;
			articleLabels: number;
			favorites: number;
		};
		executionTimeMs?: number;
		options?: {
			bookmarkCount?: number;
			labelCount?: number;
			favoriteRatio?: number;
			forceRun?: boolean;
		};
		bookmarkCount?: number;
		labelCount?: number;
		articleLabelCount?: number;
		favoriteCount?: number;
		unreadCount?: number;
		readCount?: number;
		lastUpdatedAt?: string;
	};
}

const mockSeedService: ISeedService = {
	generateSeedData: vi.fn(),
	clearAllData: vi.fn(),
	getDatabaseStatus: vi.fn(),
	validateEnvironment: vi.fn(),
};

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

			vi.mocked(mockSeedService.generateSeedData).mockResolvedValue(mockResult);

			const req = new Request("http://localhost/", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ bookmarkCount: 25, labelCount: 6 }),
			});

			const res = await app.fetch(req);
			const json = (await res.json()) as SeedResponse;

			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data?.generated).toEqual(mockResult.generated);
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

			vi.mocked(mockSeedService.generateSeedData).mockResolvedValue(mockResult);

			const req = new Request("http://localhost/", { method: "POST" });
			const res = await app.fetch(req);
			const json = (await res.json()) as SeedResponse;

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

			vi.mocked(mockSeedService.generateSeedData).mockResolvedValue(mockResult);

			const req = new Request("http://localhost/", { method: "POST" });
			const res = await app.fetch(req);
			const json = (await res.json()) as SeedResponse;

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
			const json = (await res.json()) as SeedResponse;

			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data?.cleared).toEqual({
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
			const json = (await res.json()) as SeedResponse;

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

			vi.mocked(mockSeedService.generateSeedData).mockResolvedValue(mockResult);

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
			const json = (await res.json()) as SeedResponse;

			expect(res.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data?.options).toEqual(customOptions);
			expect(json.data?.generated).toEqual(mockResult.generated);
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
			const json = (await res.json()) as SeedResponse;

			expect(res.status).toBe(400);
			expect(json.success).toBe(false);
		});

		test("範囲外の値が指定された場合はエラーが返される", async () => {
			const invalidOptions = {
				bookmarkCount: 200,
				labelCount: 25,
				favoriteRatio: 1.5,
			};

			const req = new Request("http://localhost/custom", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(invalidOptions),
			});

			const res = await app.fetch(req);
			const json = (await res.json()) as SeedResponse;

			expect(res.status).toBe(400);
			expect(json.success).toBe(false);
		});
	});
});
