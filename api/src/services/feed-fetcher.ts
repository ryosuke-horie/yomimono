/**
 * RSSフィードの取得・パースサービス
 * RSS 2.0 と Atom フォーマットに対応し、記事一覧を返す
 * フェッチまたはパースに失敗した場合はエラーをログに記録し空配列を返す
 */

import { XMLParser } from "fast-xml-parser";
import type { FeedDefinition } from "../config/feeds";

type FeedArticle = {
	url: string;
	title: string;
};

export type { FeedArticle };

export interface IFeedFetcher {
	fetchArticles(feed: FeedDefinition): Promise<FeedArticle[]>;
}

// RSS 2.0 の item 構造
type RssItem = {
	title?: string;
	link?: string;
};

// Atom の entry 構造
type AtomLink = {
	"@_href"?: string;
	"@_rel"?: string;
};

type AtomEntry = {
	title?: string | { "#text"?: string };
	link?: AtomLink | AtomLink[];
};

// XMLパーサの属性プレフィックス付きパース結果
type ParsedXml = {
	rss?: {
		channel?: {
			item?: RssItem | RssItem[];
		};
	};
	feed?: {
		entry?: AtomEntry | AtomEntry[];
	};
};

const parser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: "@_",
});

// RSS 2.0 の item 配列から記事を抽出する
function parseRssItems(items: RssItem | RssItem[]): FeedArticle[] {
	const itemArray = Array.isArray(items) ? items : [items];
	const articles: FeedArticle[] = [];
	for (const item of itemArray) {
		if (item.link && item.title) {
			articles.push({ url: item.link, title: item.title });
		}
	}
	return articles;
}

// Atom entry から link href を取得する
function getAtomLink(
	link: AtomLink | AtomLink[] | undefined,
): string | undefined {
	if (!link) return undefined;
	if (Array.isArray(link)) {
		const alternate = link.find((l) => l["@_rel"] === "alternate");
		return (alternate ?? link[0])?.["@_href"];
	}
	return link["@_href"];
}

// Atom の entry 配列から記事を抽出する
function parseAtomEntries(entries: AtomEntry | AtomEntry[]): FeedArticle[] {
	const entryArray = Array.isArray(entries) ? entries : [entries];
	const articles: FeedArticle[] = [];
	for (const entry of entryArray) {
		const url = getAtomLink(entry.link);
		const title =
			typeof entry.title === "string" ? entry.title : entry.title?.["#text"];
		if (url && title) {
			articles.push({ url, title });
		}
	}
	return articles;
}

export class FeedFetcher implements IFeedFetcher {
	async fetchArticles(feed: FeedDefinition): Promise<FeedArticle[]> {
		try {
			const response = await fetch(feed.url, {
				signal: AbortSignal.timeout(10000),
			});
			if (!response.ok) {
				console.error(
					`フィード取得失敗: ${feed.title} (${feed.url}) - status: ${response.status}`,
				);
				return [];
			}

			const xml = await response.text();
			// fast-xml-parser は any を返すため型アサーションが必要
			// 後続のオプショナルチェイニングで構造の安全性を担保する
			const parsed = parser.parse(xml) as ParsedXml;

			// RSS 2.0
			if (parsed.rss?.channel?.item) {
				return parseRssItems(parsed.rss.channel.item);
			}

			// Atom
			if (parsed.feed?.entry) {
				return parseAtomEntries(parsed.feed.entry);
			}

			console.error(
				`フィードのフォーマットを認識できません: ${feed.title} (${feed.url})`,
			);
			return [];
		} catch (error) {
			console.error(`フィード処理エラー: ${feed.title} (${feed.url})`, error);
			return [];
		}
	}
}

if (import.meta.vitest) {
	const { test, expect, describe, vi, beforeEach, afterEach } = import.meta
		.vitest;

	describe("parseRssItems", () => {
		test("RSS 2.0 の item 配列から記事を抽出する", () => {
			const items: RssItem[] = [
				{ title: "記事1", link: "https://example.com/1" },
				{ title: "記事2", link: "https://example.com/2" },
			];
			const result = parseRssItems(items);
			expect(result).toEqual([
				{ url: "https://example.com/1", title: "記事1" },
				{ url: "https://example.com/2", title: "記事2" },
			]);
		});

		test("単一の item をパースする", () => {
			const item: RssItem = {
				title: "単一記事",
				link: "https://example.com/single",
			};
			const result = parseRssItems(item);
			expect(result).toEqual([
				{ url: "https://example.com/single", title: "単一記事" },
			]);
		});

		test("title または link が欠けた item はスキップする", () => {
			const items: RssItem[] = [
				{ title: "タイトルのみ" },
				{ link: "https://example.com/link-only" },
				{ title: "正常", link: "https://example.com/valid" },
			];
			const result = parseRssItems(items);
			expect(result).toEqual([
				{ url: "https://example.com/valid", title: "正常" },
			]);
		});
	});

	describe("parseAtomEntries", () => {
		test("Atom の entry 配列から記事を抽出する", () => {
			const entries: AtomEntry[] = [
				{
					title: "Atom記事1",
					link: { "@_href": "https://example.com/atom1", "@_rel": "alternate" },
				},
				{
					title: "Atom記事2",
					link: { "@_href": "https://example.com/atom2" },
				},
			];
			const result = parseAtomEntries(entries);
			expect(result).toEqual([
				{ url: "https://example.com/atom1", title: "Atom記事1" },
				{ url: "https://example.com/atom2", title: "Atom記事2" },
			]);
		});

		test("link 配列から alternate を優先する", () => {
			const entries: AtomEntry[] = [
				{
					title: "記事",
					link: [
						{ "@_href": "https://example.com/self", "@_rel": "self" },
						{ "@_href": "https://example.com/alternate", "@_rel": "alternate" },
					],
				},
			];
			const result = parseAtomEntries(entries);
			expect(result).toEqual([
				{ url: "https://example.com/alternate", title: "記事" },
			]);
		});

		test("title がオブジェクト形式の場合も抽出する", () => {
			const entries: AtomEntry[] = [
				{
					title: { "#text": "テキストタイトル" },
					link: { "@_href": "https://example.com/1" },
				},
			];
			const result = parseAtomEntries(entries);
			expect(result).toEqual([
				{ url: "https://example.com/1", title: "テキストタイトル" },
			]);
		});
	});

	describe("getAtomLink", () => {
		test("undefined の場合は undefined を返す", () => {
			expect(getAtomLink(undefined)).toBeUndefined();
		});

		test("単一リンクオブジェクトから href を取得する", () => {
			expect(getAtomLink({ "@_href": "https://example.com" })).toBe(
				"https://example.com",
			);
		});

		test("配列から alternate がなければ最初のリンクを返す", () => {
			const links: AtomLink[] = [
				{ "@_href": "https://example.com/first" },
				{ "@_href": "https://example.com/second" },
			];
			expect(getAtomLink(links)).toBe("https://example.com/first");
		});
	});

	describe("FeedFetcher.fetchArticles", () => {
		const mockFeed = {
			id: "test-feed",
			url: "https://example.com/feed",
			title: "Test",
		};
		let originalFetch: typeof globalThis.fetch;

		beforeEach(() => {
			originalFetch = globalThis.fetch;
		});

		afterEach(() => {
			globalThis.fetch = originalFetch;
		});

		test("RSS 2.0 フィードをパースして記事を返す", async () => {
			const rssXml = `<?xml version="1.0"?>
				<rss version="2.0"><channel>
					<item><title>記事1</title><link>https://example.com/1</link></item>
				</channel></rss>`;
			globalThis.fetch = vi.fn().mockResolvedValue(new Response(rssXml));

			const fetcher = new FeedFetcher();
			const result = await fetcher.fetchArticles(mockFeed);

			expect(result).toEqual([
				{ url: "https://example.com/1", title: "記事1" },
			]);
		});

		test("Atom フィードをパースして記事を返す", async () => {
			const atomXml = `<?xml version="1.0"?>
				<feed xmlns="http://www.w3.org/2005/Atom">
					<entry><title>Atom記事</title><link href="https://example.com/atom1" rel="alternate"/></entry>
				</feed>`;
			globalThis.fetch = vi.fn().mockResolvedValue(new Response(atomXml));

			const fetcher = new FeedFetcher();
			const result = await fetcher.fetchArticles(mockFeed);

			expect(result).toEqual([
				{ url: "https://example.com/atom1", title: "Atom記事" },
			]);
		});

		test("HTTP エラー時は空配列を返す", async () => {
			globalThis.fetch = vi
				.fn()
				.mockResolvedValue(new Response("Not Found", { status: 404 }));

			const fetcher = new FeedFetcher();
			const result = await fetcher.fetchArticles(mockFeed);

			expect(result).toEqual([]);
		});

		test("ネットワークエラー時は空配列を返す", async () => {
			globalThis.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

			const fetcher = new FeedFetcher();
			const result = await fetcher.fetchArticles(mockFeed);

			expect(result).toEqual([]);
		});

		test("認識不能なフォーマット時は空配列を返す", async () => {
			globalThis.fetch = vi
				.fn()
				.mockResolvedValue(new Response("<html><body>Not RSS</body></html>"));

			const fetcher = new FeedFetcher();
			const result = await fetcher.fetchArticles(mockFeed);

			expect(result).toEqual([]);
		});
	});
}
