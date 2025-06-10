import type { D1Database } from "@cloudflare/workers-types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Article } from "../types/rss";
import { RSSBatchProcessor } from "./batchProcessor";
import { FeedProcessor } from "./feedProcessor";
import { RSSFetcher } from "./rssFetcher";
import { RSSParser } from "./rssParser";

// モックの設定
vi.mock("./rssFetcher");
vi.mock("./rssParser");
vi.mock("./batchProcessor");
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
	prepare: vi.fn(),
};

describe("FeedProcessor", () => {
	let processor: FeedProcessor;
	const mockFeed = {
		id: 1,
		url: "https://example.com/feed",
		feedName: "Test Feed",
		lastFetchedAt: null,
	};
	const mockD1Database = {
		batch: vi.fn(),
	} as unknown as D1Database;

	let mockFetcher: { fetchFeed: ReturnType<typeof vi.fn> };
	let mockParser: { parseFeed: ReturnType<typeof vi.fn> };
	let mockBatchProcessor: { logFeedProcess: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		vi.clearAllMocks();

		// モックインスタンスの作成
		mockFetcher = {
			fetchFeed: vi.fn(),
		};
		mockParser = {
			parseFeed: vi.fn(),
		};
		mockBatchProcessor = {
			logFeedProcess: vi.fn(),
		};

		// コンストラクタのモック
		(
			RSSFetcher as unknown as {
				mockImplementation: (fn: () => typeof mockFetcher) => void;
			}
		).mockImplementation(() => mockFetcher);
		(
			RSSParser as unknown as {
				mockImplementation: (fn: () => typeof mockParser) => void;
			}
		).mockImplementation(() => mockParser);
		(
			RSSBatchProcessor as unknown as {
				mockImplementation: (fn: () => typeof mockBatchProcessor) => void;
			}
		).mockImplementation(() => mockBatchProcessor);

		// DBチェーンメソッドのモック - 毎回新しいインスタンスを返す
		mockDb.select = vi.fn().mockReturnValue(mockDb);
		mockDb.insert = vi.fn().mockReturnValue(mockDb);
		mockDb.update = vi.fn().mockReturnValue(mockDb);
		mockDb.from = vi.fn().mockReturnValue(mockDb);
		mockDb.where = vi.fn().mockReturnValue(mockDb);
		mockDb.values = vi.fn().mockReturnValue(mockDb);
		mockDb.returning = vi.fn().mockReturnValue([]);
		mockDb.set = vi.fn().mockReturnValue(mockDb);
		mockDb.prepare = vi.fn().mockReturnValue({});

		processor = new FeedProcessor(mockFeed, mockD1Database);
	});

	describe("process", () => {
		it("新着記事を正常に処理する", async () => {
			const mockArticles: Article[] = [
				{
					guid: "guid1",
					url: "https://example.com/article1",
					title: "Article 1",
					description: "Description 1",
					publishedAt: new Date("2024-01-01"),
				},
				{
					guid: "guid2",
					url: "https://example.com/article2",
					title: "Article 2",
					description: "Description 2",
					publishedAt: new Date("2024-01-02"),
				},
			];

			mockFetcher.fetchFeed.mockResolvedValue("<xml>feed data</xml>");
			mockParser.parseFeed.mockResolvedValue(mockArticles);
			mockDb.where.mockResolvedValue([]); // 既存URLなし
			// 個別のinsert操作のモック
			mockDb.returning.mockResolvedValue([{ id: 1 }]);

			await processor.process();

			expect(mockFetcher.fetchFeed).toHaveBeenCalledWith(mockFeed.url);
			expect(mockParser.parseFeed).toHaveBeenCalledWith("<xml>feed data</xml>");
			expect(mockDb.insert).toHaveBeenCalledTimes(4); // 2記事 x (ブックマーク + RSS記事)
			expect(mockBatchProcessor.logFeedProcess).toHaveBeenCalledWith(
				mockFeed.id,
				"success",
				expect.objectContaining({
					itemsFetched: 2,
					itemsCreated: 2,
				}),
			);
		});

		it("publishedAtが正しく保存される", async () => {
			const publishedDate = new Date("2024-01-01T10:00:00Z");
			const mockArticles: Article[] = [
				{
					guid: "guid1",
					url: "https://example.com/article1",
					title: "Article 1",
					description: "Description 1",
					publishedAt: publishedDate,
				},
			];

			mockFetcher.fetchFeed.mockResolvedValue("<xml>feed data</xml>");
			mockParser.parseFeed.mockResolvedValue(mockArticles);
			mockDb.where.mockResolvedValue([]); // 既存URLなし
			mockDb.returning.mockResolvedValue([{ id: 1 }]);

			await processor.process();

			// RSS記事のinsertでpublishedAtが正しく渡されることを確認
			expect(mockDb.values).toHaveBeenCalledWith(
				expect.objectContaining({
					feedId: mockFeed.id,
					guid: "guid1",
					url: "https://example.com/article1",
					title: "Article 1",
					description: "Description 1",
					publishedAt: publishedDate,
				}),
			);
		});

		it("既存の記事を除外して処理する", async () => {
			const mockArticles: Article[] = [
				{
					guid: "guid1",
					url: "https://example.com/article1",
					title: "Article 1",
					description: "Description 1",
				},
				{
					guid: "guid2",
					url: "https://example.com/article2",
					title: "Article 2",
					description: "Description 2",
				},
			];

			mockFetcher.fetchFeed.mockResolvedValue("<xml>feed data</xml>");
			mockParser.parseFeed.mockResolvedValue(mockArticles);
			// 1つ目の記事は既存として返す
			mockDb.where.mockResolvedValueOnce([
				{ url: "https://example.com/article1" },
			]);
			mockDb.where.mockResolvedValueOnce([]); // RSS記事履歴には存在しない
			mockDb.returning.mockResolvedValue([{ id: 2 }]);

			await processor.process();

			// 1つの記事のみ保存される（2回のinsert: ブックマーク + RSS記事）
			expect(mockDb.insert).toHaveBeenCalledTimes(2);
			expect(mockBatchProcessor.logFeedProcess).toHaveBeenCalledWith(
				mockFeed.id,
				"success",
				expect.objectContaining({
					itemsFetched: 2,
					itemsCreated: 1,
				}),
			);
		});

		it("エラー時にエラーログを記録する", async () => {
			const error = new Error("Fetch error");
			mockFetcher.fetchFeed.mockRejectedValue(error);

			await expect(processor.process()).rejects.toThrow(error);

			expect(mockBatchProcessor.logFeedProcess).toHaveBeenCalledWith(
				mockFeed.id,
				"error",
				expect.objectContaining({
					itemsFetched: 0,
					itemsCreated: 0,
					errorMessage: "Fetch error",
				}),
			);
		});

		it("フィードの最終取得日時を更新する", async () => {
			mockFetcher.fetchFeed.mockResolvedValue("<xml>feed data</xml>");
			mockParser.parseFeed.mockResolvedValue([]);
			mockDb.where.mockResolvedValue(undefined);

			await processor.process();

			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					lastFetchedAt: expect.any(Date),
					updatedAt: expect.any(Date),
				}),
			);
		});
	});

	describe("filterNewArticles", () => {
		it("lastFetchedAtが設定されている場合、それ以降の記事のみフィルタする", async () => {
			const feedWithLastFetch = {
				...mockFeed,
				lastFetchedAt: new Date("2024-01-01T00:00:00Z"),
			};
			processor = new FeedProcessor(feedWithLastFetch, mockD1Database);

			const mockArticles: Article[] = [
				{
					guid: "guid1",
					url: "https://example.com/article1",
					title: "Old Article",
					publishedAt: new Date("2023-12-31"),
				},
				{
					guid: "guid2",
					url: "https://example.com/article2",
					title: "New Article",
					publishedAt: new Date("2024-01-02"),
				},
			];

			mockFetcher.fetchFeed.mockResolvedValue("<xml>feed data</xml>");
			mockParser.parseFeed.mockResolvedValue(mockArticles);
			mockDb.where.mockResolvedValue([]); // 既存URLなし
			mockDb.returning.mockResolvedValue([{ id: 2 }]);

			await processor.process();

			// 新しい記事のみが保存される（1記事 x 2テーブル = 2回のinsert）
			expect(mockDb.insert).toHaveBeenCalledTimes(2);
			expect(mockBatchProcessor.logFeedProcess).toHaveBeenCalledWith(
				feedWithLastFetch.id,
				"success",
				expect.objectContaining({
					itemsFetched: 2,
					itemsCreated: 1,
				}),
			);
		});

		describe("createdAt設定のテスト", () => {
			it("ブックマークのcreatedAtにpublishedAtが設定される", async () => {
				const publishedDate = new Date("2024-01-01T10:00:00Z");
				const mockArticles: Article[] = [
					{
						guid: "guid1",
						url: "https://example.com/article1",
						title: "Article 1",
						description: "Description 1",
						publishedAt: publishedDate,
					},
				];

				mockFetcher.fetchFeed.mockResolvedValue("<xml>feed data</xml>");
				mockParser.parseFeed.mockResolvedValue(mockArticles);
				mockDb.where.mockResolvedValue([]); // 既存URLなし
				mockDb.returning.mockResolvedValue([{ id: 1 }]);

				await processor.process();

				// ブックマークのinsertでcreatedAtにpublishedAtが設定されることを確認
				expect(mockDb.values).toHaveBeenCalledWith(
					expect.objectContaining({
						url: "https://example.com/article1",
						title: "Article 1",
						isRead: false,
						createdAt: publishedDate,
						updatedAt: expect.any(Date),
					}),
				);
			});

			it("publishedAtがない場合はcreatedAtに現在日時が設定される", async () => {
				const mockArticles: Article[] = [
					{
						guid: "guid1",
						url: "https://example.com/article1",
						title: "Article 1",
						description: "Description 1",
						publishedAt: undefined,
					},
				];

				mockFetcher.fetchFeed.mockResolvedValue("<xml>feed data</xml>");
				mockParser.parseFeed.mockResolvedValue(mockArticles);
				mockDb.where.mockResolvedValue([]); // 既存URLなし
				mockDb.returning.mockResolvedValue([{ id: 1 }]);

				await processor.process();

				// ブックマークのinsertでcreatedAtに現在日時が設定されることを確認
				expect(mockDb.values).toHaveBeenCalledWith(
					expect.objectContaining({
						url: "https://example.com/article1",
						title: "Article 1",
						isRead: false,
						createdAt: expect.any(Date),
						updatedAt: expect.any(Date),
					}),
				);
			});
		});
	});
});
