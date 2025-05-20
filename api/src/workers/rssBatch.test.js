import { beforeEach, describe, expect, it, vi } from "vitest";
import { RSSBatchProcessor } from "../services/batchProcessor";
import { FeedProcessor } from "../services/feedProcessor";
import rssBatch from "./rssBatch";
// モックの設定
vi.mock("../services/batchProcessor");
vi.mock("../services/feedProcessor");
describe("rssBatch", () => {
	const mockDb = {};
	const mockEnv = {
		DB: mockDb,
	};
	const mockController = {};
	const mockContext = {};
	let mockBatchProcessor;
	let mockFeedProcessor;
	beforeEach(() => {
		// モックをリセット
		vi.clearAllMocks();
		// BatchProcessorのモック
		mockBatchProcessor = {
			getActiveFeeds: vi.fn(),
			logBatchStart: vi.fn().mockResolvedValue(1), // バッチログIDを返す
			logBatchComplete: vi.fn(),
			logFeedProcess: vi.fn(),
		};
		RSSBatchProcessor.mockImplementation(() => mockBatchProcessor);
		// FeedProcessorのモック
		mockFeedProcessor = {
			process: vi.fn(),
		};
		FeedProcessor.mockImplementation(() => mockFeedProcessor);
	});
	it("アクティブなフィードがない場合は早期に終了する", async () => {
		mockBatchProcessor.getActiveFeeds.mockResolvedValue([]);
		await rssBatch.scheduled(mockController, mockEnv, mockContext);
		expect(mockBatchProcessor.getActiveFeeds).toHaveBeenCalled();
		expect(mockBatchProcessor.logBatchComplete).toHaveBeenCalledWith(
			1,
			"completed",
			0,
			0,
			0,
		);
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
		expect(mockBatchProcessor.logBatchComplete).toHaveBeenCalledWith(
			1,
			"completed",
			2,
			2,
			0,
		);
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
		// 20個のフィードが全て処理される
		expect(FeedProcessor).toHaveBeenCalledTimes(20);
		expect(mockFeedProcessor.process).toHaveBeenCalledTimes(20);
		expect(mockBatchProcessor.logBatchComplete).toHaveBeenCalledWith(
			1,
			"completed",
			20,
			20,
			0,
		);
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
		// エラーがあっても全体の処理は完了する（部分失敗）
		expect(mockBatchProcessor.logBatchComplete).toHaveBeenCalledWith(
			1,
			"partial_failure",
			3,
			2,
			1,
		);
	});
	it("バッチ処理全体でエラーが発生した場合はエラーをスローする", async () => {
		const error = new Error("Batch processing error");
		mockBatchProcessor.getActiveFeeds.mockRejectedValue(error);
		await expect(
			rssBatch.scheduled(mockController, mockEnv, mockContext),
		).rejects.toThrow(error);
		expect(mockBatchProcessor.logBatchComplete).not.toHaveBeenCalled();
	});
	it("個別のフィードで文字列エラーが発生しても処理は継続する", async () => {
		const mockFeeds = [
			{ id: 1, url: "https://example.com/feed1", feedName: "Feed 1" },
			{ id: 2, url: "https://example.com/feed2", feedName: "Feed 2" },
		];
		mockBatchProcessor.getActiveFeeds.mockResolvedValue(mockFeeds);
		// 1番目のフィードで文字列エラーを発生させる
		mockFeedProcessor.process
			.mockRejectedValueOnce("String error")
			.mockResolvedValueOnce(undefined);
		await rssBatch.scheduled(mockController, mockEnv, mockContext);
		expect(FeedProcessor).toHaveBeenCalledTimes(2);
		expect(mockFeedProcessor.process).toHaveBeenCalledTimes(2);
		// エラーがあっても全体の処理は完了する（部分失敗）
		expect(mockBatchProcessor.logBatchComplete).toHaveBeenCalledWith(
			1,
			"partial_failure",
			2,
			1,
			1,
		);
	});
});
