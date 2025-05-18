import { describe, expect, it } from "vitest";
import { RSSParser } from "../../../src/services/rssParser";
import type { Article } from "../../../src/types/rss";

describe("RSSParser", () => {
	let rssParser: RSSParser;

	beforeEach(() => {
		rssParser = new RSSParser();
	});

	describe("parseFeed", () => {
		describe("RSS 2.0 フィード", () => {
			it("正常に RSS 2.0 フィードをパースできる", async () => {
				const rss2Feed = `
					<?xml version="1.0"?>
					<rss version="2.0">
						<channel>
							<title>Example Feed</title>
							<link>https://example.com</link>
							<description>Example RSS feed</description>
							<item>
								<guid>https://example.com/post1</guid>
								<link>https://example.com/post1</link>
								<title>First Post</title>
								<description>This is the first post</description>
								<pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
								<author>author@example.com</author>
								<category>Tech</category>
								<category>News</category>
							</item>
						</channel>
					</rss>
				`;

				const articles = await rssParser.parseFeed(rss2Feed);

				expect(articles).toHaveLength(1);
				expect(articles[0]).toMatchObject({
					guid: "https://example.com/post1",
					url: "https://example.com/post1",
					title: "First Post",
					description: "This is the first post",
					author: "author@example.com",
					categories: ["Tech", "News"],
				});
				expect(articles[0].publishedAt).toBeInstanceOf(Date);
			});

			it("複数の記事をパースできる", async () => {
				const rss2Feed = `
					<?xml version="1.0"?>
					<rss version="2.0">
						<channel>
							<item>
								<guid>post1</guid>
								<link>https://example.com/post1</link>
								<title>Post 1</title>
							</item>
							<item>
								<guid>post2</guid>
								<link>https://example.com/post2</link>
								<title>Post 2</title>
							</item>
						</channel>
					</rss>
				`;

				const articles = await rssParser.parseFeed(rss2Feed);

				expect(articles).toHaveLength(2);
				expect(articles[0].guid).toBe("post1");
				expect(articles[1].guid).toBe("post2");
			});
		});

		describe("Atom フィード", () => {
			it("正常に Atom フィードをパースできる", async () => {
				const atomFeed = `
					<?xml version="1.0" encoding="utf-8"?>
					<feed xmlns="http://www.w3.org/2005/Atom">
						<title>Example Feed</title>
						<link href="https://example.com"/>
						<id>https://example.com/feed</id>
						<entry>
							<id>https://example.com/post1</id>
							<link href="https://example.com/post1"/>
							<title>First Post</title>
							<summary>This is the first post</summary>
							<updated>2024-01-01T00:00:00Z</updated>
							<author>
								<name>John Doe</name>
							</author>
							<category term="Tech"/>
							<category term="News"/>
						</entry>
					</feed>
				`;

				const articles = await rssParser.parseFeed(atomFeed);

				expect(articles).toHaveLength(1);
				expect(articles[0]).toMatchObject({
					guid: "https://example.com/post1",
					url: "https://example.com/post1",
					title: "First Post",
					description: "This is the first post",
					author: "John Doe",
					categories: ["Tech", "News"],
				});
				expect(articles[0].publishedAt).toBeInstanceOf(Date);
			});
		});

		describe("エラーハンドリング", () => {
			it("サポートされていないフィード形式の場合エラーをスローする", async () => {
				const invalidFeed = `
					<?xml version="1.0"?>
					<unknown>
						<invalid>content</invalid>
					</unknown>
				`;

				await expect(rssParser.parseFeed(invalidFeed)).rejects.toThrow(
					"Unsupported feed format",
				);
			});

			it("無効な XML の場合エラーをスローする", async () => {
				const invalidXml = "This is not XML";

				await expect(rssParser.parseFeed(invalidXml)).rejects.toThrow();
			});
		});
	});
});
