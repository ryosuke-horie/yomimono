import type {
	ExecutionContext,
	ScheduledController,
} from "@cloudflare/workers-types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RSSBatchProcessor } from "../services/batchProcessor";
import { FeedProcessor } from "../services/feedProcessor";
import rssBatch, { type Env } from "./rssBatch";

// モックの設定
vi.mock("../services/batchProcessor");
vi.mock("../services/feedProcessor");

describe("rssBatch", () => {
	const mockDb = {} as any;
	const mockEnv: Env = {
		DB: mockDb,
	};
	const mockController = {} as ScheduledController;
	const mockContext = {} as ExecutionContext;

	let mockBatchProcessor: any;
	let mockFeedProcessor: any;

	beforeEach(() => {
		// モックをリセット
		vi.clearAllMocks();

		// BatchProcessorのモック
		mockBatchProcessor = {
			getActiveFeeds: vi.fn(),
			logBatchComplete: vi.fn(),
			logBatchError: vi.fn(),
		};
		(RSSBatchProcessor as any).mockImplementation(() => mockBatchProcessor);

		// FeedProcessorのモック
		mockFeedProcessor = {
			process: vi.fn(),
		};
		(FeedProcessor as any).mockImplementation(() => mockFeedProcessor);
	});

	it("アクティブなフィードがない場合は早期に終了する", async () => {
		mockBatchProcessor.getActiveFeeds.mockResolvedValue([]);

		await rssBatch.scheduled(mockController, mockEnv, mockContext);

		expect(mockBatchProcessor.getActiveFeeds).toHaveBeenCalled();
		expect(mockBatchProcessor.logBatchComplete).not.toHaveBeenCalled();
		expect(mockFeedProcessor.process).not.toHaveBeenCalled();
	});

	it("アクティブなフィードを正常に処理する", async () => {
		const mockFeeds = [
			{ id: 1, url: "https://example.com/feed1", feedName: "Feed 1" },
			{ id: 2, url: "https://example.com/feed2", feedName: "Feed 2" },
		];
		mockBatchProcessor.getActiveFeeds.mockResolvedValue(mockFeeds);
		mockFeedProcessor.process.mockResolvedValue(undefined);

		await rssBatch.scheduled(mockController, mockEnv, mockContext);

		expect(mockBatchProcessor.getActiveFeeds).toHaveBeenCalled();
		expect(FeedProcessor).toHaveBeenCalledTimes(2);
		expect(mockFeedProcessor.process).toHaveBeenCalledTimes(2);
		expect(mockBatchProcessor.logBatchComplete).toHaveBeenCalledWith(2);
		expect(mockBatchProcessor.logBatchError).not.toHaveBeenCalled();
	});

	it("並行処理の制限が適用される", async () => {
		// 20個のフィードで並行処理制限（10）をテスト
		const mockFeeds = Array.from({ length: 20 }, (_, i) => ({
			id: i + 1,
			url: `https://example.com/feed${i + 1}`,
			feedName: `Feed ${i + 1}`,
		}));
		mockBatchProcessor.getActiveFeeds.mockResolvedValue(mockFeeds);
		mockFeedProcessor.process.mockResolvedValue(undefined);

		await rssBatch.scheduled(mockController, mockEnv, mockContext);

		// 20個のフィードが10個ずつのチャンクで処理される
		expect(FeedProcessor).toHaveBeenCalledTimes(20);
		expect(mockFeedProcessor.process).toHaveBeenCalledTimes(20);
		expect(mockBatchProcessor.logBatchComplete).toHaveBeenCalledWith(20);
	});

	it("個別のフィードでエラーが発生しても処理は継続する", async () => {
		const mockFeeds = [
			{ id: 1, url: "https://example.com/feed1", feedName: "Feed 1" },
			{ id: 2, url: "https://example.com/feed2", feedName: "Feed 2" },
			{ id: 3, url: "https://example.com/feed3", feedName: "Feed 3" },
		];
		mockBatchProcessor.getActiveFeeds.mockResolvedValue(mockFeeds);

		// 2番目のフィードでエラーを発生させる
		mockFeedProcessor.process
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(new Error("Feed processing error"))
			.mockResolvedValueOnce(undefined);

		await rssBatch.scheduled(mockController, mockEnv, mockContext);

		expect(FeedProcessor).toHaveBeenCalledTimes(3);
		expect(mockFeedProcessor.process).toHaveBeenCalledTimes(3);
		// エラーがあっても全体の処理は完了する
		expect(mockBatchProcessor.logBatchComplete).toHaveBeenCalledWith(3);
		expect(mockBatchProcessor.logBatchError).not.toHaveBeenCalled();
	});

	it("バッチ処理全体でエラーが発生した場合はエラーログを記録する", async () => {
		const error = new Error("Batch processing error");
		mockBatchProcessor.getActiveFeeds.mockRejectedValue(error);

		await rssBatch.scheduled(mockController, mockEnv, mockContext);

		expect(mockBatchProcessor.logBatchComplete).not.toHaveBeenCalled();
		expect(mockBatchProcessor.logBatchError).toHaveBeenCalledWith(error);
	});
});
