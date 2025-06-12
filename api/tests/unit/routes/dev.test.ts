import type { D1Database } from "@cloudflare/workers-types";
import type { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../../../src/index";
import type { Env } from "../../../src/index";

// モックの設定

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
	let app: Hono<{ Bindings: Env }>;
	let env: Env;

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
		} as unknown as D1Database;

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
			// Drizzleモックの設定
			const { drizzle } = await import("drizzle-orm/d1");
			(drizzle as ReturnType<typeof vi.fn>).mockImplementation(() => ({
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				limit: vi.fn().mockResolvedValue([{ id: 1 }]),
			}));

			app = createApp(env);

			const req = new Request("http://localhost/api/dev/db-test");
			const res = await app.fetch(req, env);

			expect(res.status).toBe(200);
			const data = await res.json();
			expect(data).toEqual({
				message: "DB connection successful",
				bookmarkCount: 1,
			});
		});

		it("データベース接続エラー時にエラーを返す", async () => {
			// Drizzleモックの設定
			const { drizzle } = await import("drizzle-orm/d1");
			(drizzle as ReturnType<typeof vi.fn>).mockImplementation(() => ({
				select: vi.fn().mockReturnThis(),
				from: vi.fn().mockReturnThis(),
				limit: vi.fn().mockRejectedValue(new Error("Database error")),
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
			(drizzle as ReturnType<typeof vi.fn>).mockImplementation(() => ({
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
			(drizzle as ReturnType<typeof vi.fn>).mockImplementation(() => ({
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
});
