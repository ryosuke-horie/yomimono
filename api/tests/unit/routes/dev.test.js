import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../../src/index";
// モックの設定
vi.mock("../../../src/workers/rssBatch", () => ({
	default: {
		scheduled: vi.fn(),
	},
}));
// RssFeedRepositoryのモック
vi.mock("../../../src/repositories/rssFeed", () => {
	const mockFindAllActive = vi.fn().mockResolvedValue([]);
	return {
		RssFeedRepository: vi.fn().mockImplementation(() => ({
			findAllActive: mockFindAllActive,
		})),
	};
});
// DrizzleとDB関連のモック
vi.mock("drizzle-orm/d1", () => ({
	drizzle: vi.fn().mockImplementation(() => ({
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		execute: vi.fn().mockResolvedValue([]),
		all: vi.fn().mockResolvedValue([]),
	})),
}));
describe("開発用エンドポイント", () => {
	let app;
	let env;
	beforeEach(() => {
		vi.clearAllMocks();
		// モックDB
		const mockDb = {
			prepare: vi.fn(() => ({
				all: vi.fn().mockResolvedValue({ results: [], success: true }),
				first: vi.fn().mockResolvedValue(null),
				run: vi.fn().mockResolvedValue({ success: true }),
			})),
			batch: vi.fn().mockResolvedValue([]),
		};
		env = {
			DB: mockDb,
			NODE_ENV: "development",
		};
		// app作成は各テストで行うようにする（DB stateが変わるため）
	});
	describe("GET /api/dev/test", () => {
		it("APIの動作確認メッセージを返す", async () => {
			app = createApp(env);
			const req = new Request("http://localhost/api/dev/test");
			const res = await app.fetch(req, env);
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({ message: "API is working!" });
		});
	});
	describe("GET /api/dev/db-test", () => {
		it("データベース接続テストが成功する", async () => {
			// モックの設定
			const mockFeeds = [
				{
					id: 1,
					name: "Test Feed 1",
					url: "https://example.com/feed1",
					isActive: true,
				},
				{
					id: 2,
					name: "Test Feed 2",
					url: "https://example.com/feed2",
					isActive: true,
				},
			];
			const mockDb = {
				prepare: vi.fn(() => ({
					all: vi.fn().mockResolvedValue({
						results: mockFeeds,
						success: true,
					}),
				})),
			};
			env.DB = mockDb;
			// RssFeedRepositoryのモックを更新
			const { RssFeedRepository } = await import(
				"../../../src/repositories/rssFeed"
			);
			RssFeedRepository.mockImplementation(() => ({
				findAllActive: vi
					.fn()
					.mockResolvedValue(
						mockFeeds.map((f) => ({ id: f.id, name: f.name, url: f.url })),
					),
			}));
			app = createApp(env);
			const req = new Request("http://localhost/api/dev/db-test");
			const res = await app.fetch(req, env);
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				message: "DB connection successful",
				activeFeeds: 2,
				feeds: [
					{ id: 1, name: "Test Feed 1", url: "https://example.com/feed1" },
					{ id: 2, name: "Test Feed 2", url: "https://example.com/feed2" },
				],
			});
		});
		it("データベース接続エラー時にエラーを返す", async () => {
			// エラーをthrowするモック
			const mockDb = {
				prepare: vi.fn(() => ({
					all: vi.fn().mockRejectedValue(new Error("Database error")),
				})),
			};
			env.DB = mockDb;
			// RssFeedRepositoryのエラーモック
			const { RssFeedRepository } = await import(
				"../../../src/repositories/rssFeed"
			);
			RssFeedRepository.mockImplementation(() => ({
				findAllActive: vi.fn().mockRejectedValue(new Error("Database error")),
			}));
			app = createApp(env);
			const req = new Request("http://localhost/api/dev/db-test");
			const res = await app.fetch(req, env);
			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data).toEqual({
				message: "DB connection failed",
				error: "Database error",
			});
		});
	});
	describe("GET /api/dev/batch-logs", () => {
		it("バッチログを取得できる", async () => {
			const mockLogs = [
				{
					id: 1,
					feedId: 1,
					status: "success",
					itemsFetched: 10,
					itemsCreated: 8,
					startedAt: "2024-01-01T00:00:00Z",
				},
			];
			// Drizzleモックの再設定
			const { drizzle } = await import("drizzle-orm/d1");
			drizzle.mockImplementation(() => ({
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				orderBy: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue(mockLogs),
			}));
			app = createApp(env);
			const req = new Request("http://localhost/api/dev/batch-logs");
			const res = await app.fetch(req, env);
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				success: true,
				logs: mockLogs,
			});
		});
		it("エラー時にエラーレスポンスを返す", async () => {
			// Drizzleモックの再設定
			const { drizzle } = await import("drizzle-orm/d1");
			drizzle.mockImplementation(() => ({
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				orderBy: vi.fn().mockReturnThis(),
				limit: vi.fn().mockRejectedValue(new Error("Query failed")),
			}));
			app = createApp(env);
			const req = new Request("http://localhost/api/dev/batch-logs");
			const res = await app.fetch(req, env);
			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data).toEqual({
				success: false,
				error: "Query failed",
			});
		});
	});
	describe("GET /api/dev/recent-bookmarks", () => {
		it("最新のブックマークを取得できる", async () => {
			const mockBookmarks = [
				{
					id: 1,
					title: "Test Article",
					url: "https://example.com/article1",
					isRead: false,
					createdAt: "2024-01-01T00:00:00Z",
				},
			];
			// Drizzleモックの再設定
			const { drizzle } = await import("drizzle-orm/d1");
			drizzle.mockImplementation(() => ({
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				orderBy: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue(mockBookmarks),
			}));
			app = createApp(env);
			const req = new Request("http://localhost/api/dev/recent-bookmarks");
			const res = await app.fetch(req, env);
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				success: true,
				count: 1,
				bookmarks: mockBookmarks,
			});
		});
		it("エラー時にエラーレスポンスを返す", async () => {
			// Drizzleモックの再設定
			const { drizzle } = await import("drizzle-orm/d1");
			drizzle.mockImplementation(() => ({
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				orderBy: vi.fn().mockReturnThis(),
				limit: vi.fn().mockRejectedValue(new Error("Query failed")),
			}));
			app = createApp(env);
			const req = new Request("http://localhost/api/dev/recent-bookmarks");
			const res = await app.fetch(req, env);
			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data).toEqual({
				success: false,
				error: "Query failed",
			});
		});
	});
	describe("POST /api/dev/rss-batch/run", () => {
		it("バッチ処理を正常に実行できる", async () => {
			// rssBatchモジュールのインポート
			const rssBatch = await import("../../../src/workers/rssBatch");
			rssBatch.default.scheduled.mockResolvedValue(undefined);
			app = createApp(env);
			const req = new Request("http://localhost/api/dev/rss-batch/run", {
				method: "POST",
			});
			const res = await app.fetch(req, env);
			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				success: true,
				message: "バッチ処理が完了しました",
			});
			expect(rssBatch.default.scheduled).toHaveBeenCalledWith(
				expect.any(Object),
				env,
				expect.any(Object),
			);
		});
		it("バッチ処理エラー時にエラーレスポンスを返す", async () => {
			const rssBatch = await import("../../../src/workers/rssBatch");
			const error = new Error("Batch processing failed");
			rssBatch.default.scheduled.mockRejectedValue(error);
			app = createApp(env);
			const req = new Request("http://localhost/api/dev/rss-batch/run", {
				method: "POST",
			});
			const res = await app.fetch(req, env);
			expect(res.status).toBe(500);
			const data = await res.json();
			expect(data).toEqual({
				success: false,
				error: "Batch processing failed",
			});
		});
	});
});
