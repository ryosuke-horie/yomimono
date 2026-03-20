/**
 * RSSフィードサービス
 * 全定義フィードから新着記事を取得し、bookmarks として一括保存する
 * 既存 URL との重複排除を行い、新規記事のみを保存する
 */

import { FEED_DEFINITIONS } from "../config/feeds";
import type { IBookmarkRepository } from "../interfaces/repository/bookmark";
import type { FeedArticle, IFeedFetcher } from "./feed-fetcher";

export interface IRssFeedService {
	fetchAndSaveAllFeeds(): Promise<void>;
}

export class RssFeedService implements IRssFeedService {
	constructor(
		private readonly feedFetcher: IFeedFetcher,
		private readonly bookmarkRepository: IBookmarkRepository,
	) {}

	async fetchAndSaveAllFeeds(): Promise<void> {
		// 全フィードから記事を並列取得する
		const results = await Promise.allSettled(
			FEED_DEFINITIONS.map(async (feed) => {
				const articles = await this.feedFetcher.fetchArticles(feed);
				return articles.map((article) => ({ article, feedId: feed.id }));
			}),
		);

		const allArticles: { article: FeedArticle; feedId: string }[] = [];
		for (const result of results) {
			if (result.status === "fulfilled") {
				allArticles.push(...result.value);
			}
		}

		if (allArticles.length === 0) {
			console.log("RSS: 新着記事はありませんでした");
			return;
		}

		// 既存 URL を検索して重複を排除する（バッチ分割で D1 の IN 句上限を回避）
		const urls = allArticles.map((a) => a.article.url);
		const existingUrls = new Set<string>();
		const batchSize = 50;
		for (let i = 0; i < urls.length; i += batchSize) {
			const batch = urls.slice(i, i + batchSize);
			const existing = await this.bookmarkRepository.findByUrls(batch);
			for (const b of existing) {
				existingUrls.add(b.url);
			}
		}

		const newArticles = allArticles.filter(
			(a) => !existingUrls.has(a.article.url),
		);

		if (newArticles.length === 0) {
			console.log("RSS: 全記事が既に保存済みです");
			return;
		}

		// 新規記事を bookmark として保存する
		await this.bookmarkRepository.createMany(
			newArticles.map((a) => ({
				url: a.article.url,
				title: a.article.title,
				feedId: a.feedId,
			})),
		);

		console.log(`RSS: ${newArticles.length} 件の新着記事を保存しました`);
	}
}

if (import.meta.vitest) {
	const { test, expect, describe, vi } = import.meta.vitest;

	const createMockFeedFetcher = (): IFeedFetcher => ({
		fetchArticles: vi.fn().mockResolvedValue([]),
	});

	const createMockBookmarkRepository = (): IBookmarkRepository => ({
		createMany: vi.fn().mockResolvedValue(undefined),
		findByUrls: vi.fn().mockResolvedValue([]),
		findUnread: vi.fn().mockResolvedValue([]),
		markAsRead: vi.fn().mockResolvedValue(true),
		markAsUnread: vi.fn().mockResolvedValue(true),
		countUnread: vi.fn().mockResolvedValue(0),
		countTodayRead: vi.fn().mockResolvedValue(0),
		addToFavorites: vi.fn().mockResolvedValue(undefined),
		removeFromFavorites: vi.fn().mockResolvedValue(undefined),
		getFavoriteBookmarks: vi
			.fn()
			.mockResolvedValue({ bookmarks: [], total: 0 }),
		isFavorite: vi.fn().mockResolvedValue(false),
		findRecentlyRead: vi.fn().mockResolvedValue([]),
		findById: vi.fn().mockResolvedValue(undefined),
		findByIds: vi.fn().mockResolvedValue(new Map()),
	});

	describe("RssFeedService", () => {
		test("記事がない場合は createMany を呼ばない", async () => {
			const fetcher = createMockFeedFetcher();
			const repo = createMockBookmarkRepository();
			const service = new RssFeedService(fetcher, repo);

			await service.fetchAndSaveAllFeeds();

			expect(repo.createMany).not.toHaveBeenCalled();
		});

		test("新着記事を bookmark として保存する", async () => {
			const fetcher = createMockFeedFetcher();
			const repo = createMockBookmarkRepository();

			vi.mocked(fetcher.fetchArticles).mockResolvedValue([
				{ url: "https://example.com/new", title: "新着記事" },
			]);

			const service = new RssFeedService(fetcher, repo);
			await service.fetchAndSaveAllFeeds();

			expect(repo.createMany).toHaveBeenCalledWith([
				{
					url: "https://example.com/new",
					title: "新着記事",
					feedId: FEED_DEFINITIONS[0].id,
				},
			]);
		});

		test("既存 URL の記事は保存をスキップする", async () => {
			const fetcher = createMockFeedFetcher();
			const repo = createMockBookmarkRepository();

			vi.mocked(fetcher.fetchArticles).mockResolvedValue([
				{ url: "https://example.com/existing", title: "既存記事" },
				{ url: "https://example.com/new", title: "新着記事" },
			]);

			vi.mocked(repo.findByUrls).mockResolvedValue([
				{
					id: 1,
					url: "https://example.com/existing",
					title: "既存記事",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					feedId: null,
					isFavorite: false,
				},
			]);

			const service = new RssFeedService(fetcher, repo);
			await service.fetchAndSaveAllFeeds();

			expect(repo.createMany).toHaveBeenCalledWith([
				{
					url: "https://example.com/new",
					title: "新着記事",
					feedId: FEED_DEFINITIONS[0].id,
				},
			]);
		});

		test("全記事が既存の場合は createMany を呼ばない", async () => {
			const fetcher = createMockFeedFetcher();
			const repo = createMockBookmarkRepository();

			vi.mocked(fetcher.fetchArticles).mockResolvedValue([
				{ url: "https://example.com/existing", title: "既存記事" },
			]);

			vi.mocked(repo.findByUrls).mockResolvedValue([
				{
					id: 1,
					url: "https://example.com/existing",
					title: "既存記事",
					isRead: false,
					createdAt: new Date(),
					updatedAt: new Date(),
					feedId: null,
					isFavorite: false,
				},
			]);

			const service = new RssFeedService(fetcher, repo);
			await service.fetchAndSaveAllFeeds();

			expect(repo.createMany).not.toHaveBeenCalled();
		});
	});
}
