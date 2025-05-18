import type { ExecutionContext } from "@cloudflare/workers-types";
import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createRssBatchRouter } from "../../../src/routes/rssBatch";
import { RSSBatchProcessor } from "../../../src/services/batchProcessor";
import type { TestDatabase } from "../../test-utils";
import { createTestDatabase } from "../../test-utils";

vi.mock("../../../src/services/batchProcessor");
vi.mock("../../../src/services/feedProcessor");

describe("rssBatchルート", () => {
	let app: Hono;
	let db: TestDatabase;

	beforeEach(async () => {
		db = await createTestDatabase();
		app = new Hono();
		const rssBatchRouter = createRssBatchRouter(db);
		app.route("/", rssBatchRouter);
	});

	describe("POST /api/rss/batch/execute", () => {
		it("正常に手動バッチ実行を開始できること", async () => {
			// ジョブIDのモック
			const mockJobId = "test-job-id";
			vi.spyOn(crypto, "randomUUID").mockReturnValue(mockJobId);

			// RSSBatchProcessorのモック
			const mockProcessor = {
				logBatchStart: vi.fn().mockResolvedValue(1),
				getActiveFeeds: vi.fn().mockResolvedValue([
					{
						id: 1,
						url: "https://example.com/feed1",
						feedName: "Feed 1",
						lastFetchedAt: null,
					},
					{
						id: 2,
						url: "https://example.com/feed2",
						feedName: "Feed 2",
						lastFetchedAt: null,
					},
				]),
				logBatchComplete: vi.fn().mockResolvedValue(undefined),
				logBatchError: vi.fn().mockResolvedValue(undefined),
			};
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のモックオブジェクトであるため
			vi.mocked(RSSBatchProcessor).mockImplementation(
				() => mockProcessor as any,
			);

			// ExecutionContextのモック
			const mockContext: ExecutionContext = {
				waitUntil: vi.fn(),
				passThroughOnException: vi.fn(),
			};

			// リクエストの作成
			const req = new Request("http://localhost/api/rss/batch/execute", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ feedIds: [1, 2] }),
			});

			const res = await app.fetch(req, { DB: db }, mockContext);
			const json = await res.json();

			expect(res.status).toBe(200);
			expect(json).toEqual({
				jobId: mockJobId,
				status: "started",
				targetFeeds: 2,
				startedAt: expect.any(String),
			});

			// 非同期処理が開始されたことを確認
			expect(mockContext.waitUntil).toHaveBeenCalledTimes(1);
		});

		it("feedIdsが指定されない場合、全フィードを対象にすること", async () => {
			const mockJobId = "test-job-id-all";
			vi.spyOn(crypto, "randomUUID").mockReturnValue(mockJobId);

			const mockProcessor = {
				logBatchStart: vi.fn().mockResolvedValue(1),
				getActiveFeeds: vi.fn().mockResolvedValue([
					{
						id: 1,
						url: "https://example.com/feed1",
						feedName: "Feed 1",
						lastFetchedAt: null,
					},
					{
						id: 2,
						url: "https://example.com/feed2",
						feedName: "Feed 2",
						lastFetchedAt: null,
					},
				]),
				logBatchComplete: vi.fn().mockResolvedValue(undefined),
				logBatchError: vi.fn().mockResolvedValue(undefined),
			};
			// biome-ignore lint/suspicious/noExplicitAny: テスト用のモックオブジェクトであるため
			vi.mocked(RSSBatchProcessor).mockImplementation(
				() => mockProcessor as any,
			);

			const mockContext: ExecutionContext = {
				waitUntil: vi.fn(),
				passThroughOnException: vi.fn(),
			};

			const req = new Request("http://localhost/api/rss/batch/execute", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});

			const res = await app.fetch(req, { DB: db }, mockContext);
			const json = await res.json();

			expect(res.status).toBe(200);
			expect(json).toEqual({
				jobId: mockJobId,
				status: "started",
				targetFeeds: "all",
				startedAt: expect.any(String),
			});
		});

		it("リクエストエラーの場合、500を返すこと", async () => {
			const req = new Request("http://localhost/api/rss/batch/execute", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "invalid json",
			});

			const mockContext: ExecutionContext = {
				waitUntil: vi.fn(),
				passThroughOnException: vi.fn(),
			};

			const res = await app.fetch(req, { DB: db }, mockContext);
			const json = await res.json();

			expect(res.status).toBe(500);
			expect(json).toEqual({
				error: "Failed to start batch execution",
			});
		});
	});

	describe("GET /api/rss/batch/logs", () => {
		it("バッチログエンドポイントが存在すること", async () => {
			const req = new Request("http://localhost/api/rss/batch/logs", {
				method: "GET",
			});

			const res = await app.fetch(req, { DB: db });
			const json = await res.json();

			expect(res.status).toBe(200);
			expect(json).toEqual({
				message: "Batch logs endpoint (not implemented yet)",
			});
		});
	});
});
