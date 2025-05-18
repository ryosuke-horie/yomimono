import type { D1Database } from "@cloudflare/workers-types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { rssBatchLogs, rssFeeds } from "../db/schema";
import { RSSBatchProcessor } from "./batchProcessor";

// drizzle-ormのモック
vi.mock("drizzle-orm/d1", () => ({
	drizzle: vi.fn(() => mockDb),
}));

// モックDBの設定
const mockDb = {
	select: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
	from: vi.fn(),
	where: vi.fn(),
	values: vi.fn(),
	returning: vi.fn(),
	set: vi.fn(),
};

describe("RSSBatchProcessor", () => {
	let processor: RSSBatchProcessor;
	const mockD1Database = {} as unknown as D1Database;

	beforeEach(() => {
		vi.clearAllMocks();
		processor = new RSSBatchProcessor(mockD1Database);

		// チェーンメソッドのモック設定
		mockDb.select.mockReturnValue(mockDb);
		mockDb.insert.mockReturnValue(mockDb);
		mockDb.update.mockReturnValue(mockDb);
		mockDb.from.mockReturnValue(mockDb);
		mockDb.where.mockReturnValue(mockDb);
		mockDb.values.mockReturnValue(mockDb);
		mockDb.returning.mockReturnValue(mockDb);
		mockDb.set.mockReturnValue(mockDb);
	});

	describe("getActiveFeeds", () => {
		it("アクティブなフィードを正常に取得する", async () => {
			const mockFeeds = [
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
					lastFetchedAt: "2024-01-01T00:00:00Z",
				},
			];
			mockDb.where.mockResolvedValue(mockFeeds);

			const result = await processor.getActiveFeeds();

			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(rssFeeds);
			expect(mockDb.where).toHaveBeenCalled();
			expect(result).toEqual(mockFeeds);
		});

		it("エラー時に例外をスローする", async () => {
			mockDb.where.mockRejectedValue(new Error("Database error"));

			await expect(processor.getActiveFeeds()).rejects.toThrow(
				"Failed to fetch active feeds",
			);
		});
	});

	describe("logBatchComplete", () => {
		it("バッチ完了ログを正常に記録する", async () => {
			mockDb.where.mockResolvedValue(undefined);

			await processor.logBatchComplete(1, "completed", 10, 8, 2);

			expect(mockDb.update).toHaveBeenCalledWith(rssBatchLogs);
			// setメソッドも追加でモックする必要がある
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "completed",
					finishedAt: expect.any(Date),
					itemsCreated: 8,
					itemsFetched: 10,
				}),
			);
		});

		it("エラー時に例外をスローする", async () => {
			mockDb.where.mockRejectedValue(new Error("Database error"));

			await expect(
				processor.logBatchComplete(1, "completed", 10, 8, 2),
			).rejects.toThrow("Failed to log batch complete");
		});
	});

	describe("logBatchStart", () => {
		it("バッチ開始ログを正常に記録する", async () => {
			mockDb.returning.mockResolvedValue([{ id: 123 }]);

			const result = await processor.logBatchStart("Test Batch");

			expect(mockDb.insert).toHaveBeenCalledWith(rssBatchLogs);
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					status: "in_progress",
					startedAt: expect.any(Date),
					feedId: 1, // 暫定的に1を使用
					itemsCreated: 0,
					itemsFetched: 0,
				}),
			);
			expect(result).toBe(123);
		});

		it("エラー時に例外をスローする", async () => {
			mockDb.returning.mockRejectedValue(new Error("Database error"));

			await expect(processor.logBatchStart()).rejects.toThrow(
				"Failed to log batch start",
			);
		});
	});

	describe("logFeedProcess", () => {
		it("成功時のフィード処理ログを記録する", async () => {
			mockDb.values.mockResolvedValue(undefined);
			const details = {
				itemsFetched: 10,
				itemsCreated: 8,
				startedAt: new Date("2024-01-01T00:00:00Z"),
				finishedAt: new Date("2024-01-01T00:01:00Z"),
			};

			await processor.logFeedProcess(1, "success", details);

			expect(mockDb.insert).toHaveBeenCalledWith(rssBatchLogs);
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					feedId: 1,
					status: "success",
					itemsFetched: 10,
					itemsCreated: 8,
					errorMessage: undefined,
					startedAt: details.startedAt,
					finishedAt: details.finishedAt,
				}),
			);
		});

		it("エラー時のフィード処理ログを記録する", async () => {
			mockDb.values.mockResolvedValue(undefined);
			const details = {
				itemsFetched: 0,
				itemsCreated: 0,
				errorMessage: "Feed fetch error",
				startedAt: new Date("2024-01-01T00:00:00Z"),
				finishedAt: new Date("2024-01-01T00:01:00Z"),
			};

			await processor.logFeedProcess(1, "error", details);

			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					feedId: 1,
					status: "error",
					itemsFetched: 0,
					itemsCreated: 0,
					errorMessage: "Feed fetch error",
					startedAt: details.startedAt,
					finishedAt: details.finishedAt,
				}),
			);
		});

		it("ログエラーを無視する", async () => {
			mockDb.values.mockRejectedValue(new Error("Log error"));

			await expect(
				processor.logFeedProcess(1, "success", {
					itemsFetched: 5,
					itemsCreated: 3,
					startedAt: new Date(),
					finishedAt: new Date(),
				}),
			).resolves.toBeUndefined();
		});
	});
});
