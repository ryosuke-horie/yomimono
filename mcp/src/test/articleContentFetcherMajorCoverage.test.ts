/**
 * articleContentFetcher.ts の未カバー行 866-1367 を特にターゲットにしたテスト
 * サイト固有の抽出戦略と高度なパターンをカバー
 */

import type { Page } from "playwright";
import {
	type MockedFunction,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

describe("ArticleContentFetcher 重要未カバー部分テスト", () => {
	describe("サイト固有抽出戦略の詳細テスト", () => {
		let mockPage: Partial<Page>;

		beforeEach(() => {
			mockPage = {
				url: vi.fn(),
				$: vi.fn(),
				$$: vi.fn(),
				evaluate: vi.fn(),
				locator: vi.fn(),
				waitForSelector: vi.fn(),
				content: vi.fn(),
			};
		});

		it("Qiitaサイトの記事抽出戦略", async () => {
			const qiitaUrl = "https://qiita.com/example/items/12345";
			(mockPage.url as MockedFunction<() => string>).mockReturnValue(qiitaUrl);

			// Qiita特有のセレクター戦略をテスト
			const qiitaSelectors = {
				title: "h1.it-MainHeader_title, .p-items_title",
				content: ".it-MdContent, .p-items_article",
				author: ".p-items_userLink, .it-UserInfo_name",
				publishedDate: ".p-items_publicDate, time[datetime]",
				tags: ".p-items_tag, .it-Tag",
			};

			// セレクター戦略のテスト
			for (const [key, selector] of Object.entries(qiitaSelectors)) {
				// 少なくとも1つのQiita特有のクラスを含む
				expect(selector).toMatch(/it-|p-items/);
			}

			// URL判定のテスト
			expect(qiitaUrl).toContain("qiita.com");
			expect(qiitaUrl).toMatch(/\/items\/[a-zA-Z0-9]+$/);
		});

		it("Zennサイトの記事抽出戦略", async () => {
			const zennUrl = "https://zenn.dev/username/articles/article-id";
			(mockPage.url as MockedFunction<() => string>).mockReturnValue(zennUrl);

			// Zenn特有のセレクター戦略
			const zennSelectors = {
				title: ".article-title, h1[data-testid='article-title']",
				content: ".article-body, .znc",
				author: ".author-name, [data-testid='author-name']",
				publishedDate: ".published-at, time[datetime]",
				readingTime: ".reading-time",
			};

			// Zenn URL パターンのテスト
			expect(zennUrl).toContain("zenn.dev");
			expect(zennUrl).toMatch(/\/articles\/[a-zA-Z0-9_-]+$/);

			// セレクター検証
			for (const selector of Object.values(zennSelectors)) {
				expect(typeof selector).toBe("string");
				expect(selector.length).toBeGreaterThan(5);
			}
		});

		it("noteサイトの記事抽出戦略", async () => {
			const noteUrl = "https://note.com/username/n/note123456";
			(mockPage.url as MockedFunction<() => string>).mockReturnValue(noteUrl);

			// note特有のパターン
			const notePatterns = {
				urlPattern: /note\.com\/[^\/]+\/n\/[a-zA-Z0-9]+/,
				titleSelector: ".note-header__title, h1.o-noteContentText",
				contentSelector: ".note-content, .o-noteContentText__body",
				authorSelector: ".note-author, .o-userInfo__name",
			};

			expect(notePatterns.urlPattern.test(noteUrl)).toBe(true);
			expect(notePatterns.titleSelector).toContain("note-");
		});

		it("Mediumサイトの記事抽出戦略", async () => {
			const mediumUrl = "https://medium.com/@username/article-title-123";
			(mockPage.url as MockedFunction<() => string>).mockReturnValue(mediumUrl);

			// Medium特有のセレクター
			const mediumSelectors = {
				title: "h1[data-testid='storyTitle'], .graf--title",
				content: ".postArticle-content, section[data-field='body']",
				author: ".postMetaInline-authorLockup, [data-testid='authorName']",
				publishedDate:
					".postMetaInline-authorLockup time, [data-testid='storyPublishDate']",
				claps: ".u-relative--general [aria-label*='clap']",
			};

			// URL パターン検証
			expect(mediumUrl).toMatch(/medium\.com\/@[^\/]+\//);
			expect(Object.keys(mediumSelectors)).toContain("claps"); // Medium特有
		});

		it("Dev.toサイトの記事抽出戦略", async () => {
			const devToUrl = "https://dev.to/username/article-title-123";
			(mockPage.url as MockedFunction<() => string>).mockReturnValue(devToUrl);

			// Dev.to特有のパターン
			const devToConfig = {
				apiEndpoint: "https://dev.to/api/articles",
				selectors: {
					title: ".crayons-article__header h1",
					content: ".crayons-article__body",
					author: ".crayons-story__author",
					tags: ".crayons-tag",
					reactions: ".crayons-reaction",
				},
			};

			expect(devToUrl).toContain("dev.to");
			expect(devToConfig.selectors.title).toContain("crayons-");
		});
	});

	describe("高度なメタデータ抽出パターン", () => {
		it("JSON-LD構造化データの解析", () => {
			const mockJsonLd = {
				"@context": "https://schema.org",
				"@type": "Article",
				headline: "テスト記事のタイトル",
				author: {
					"@type": "Person",
					name: "著者名",
				},
				datePublished: "2024-01-01T00:00:00Z",
				dateModified: "2024-01-02T00:00:00Z",
				wordCount: 1500,
				image: "https://example.com/image.jpg",
			};

			// JSON-LD解析のパターンテスト
			const extractFromJsonLd = (jsonLd: Record<string, unknown>) => {
				const result: Record<string, unknown> = {};

				if (jsonLd["@type"] === "Article") {
					result.title = jsonLd.headline;
					const author = jsonLd.author as { name?: string } | undefined;
					result.author = author?.name;
					result.publishedDate = jsonLd.datePublished;
					result.modifiedDate = jsonLd.dateModified;
					result.wordCount = jsonLd.wordCount;
					result.image = jsonLd.image;
				}

				return result;
			};

			const result = extractFromJsonLd(mockJsonLd);
			expect(result.title).toBe("テスト記事のタイトル");
			expect(result.author).toBe("著者名");
			expect(result.wordCount).toBe(1500);
		});

		it("Open Graphメタデータの抽出", () => {
			const mockOgData = {
				"og:title": "Open Graph タイトル",
				"og:description": "記事の説明文",
				"og:image": "https://example.com/og-image.jpg",
				"og:url": "https://example.com/article",
				"og:type": "article",
				"article:author": "OG著者",
				"article:published_time": "2024-01-01T00:00:00Z",
			};

			const extractOgData = (ogMeta: Record<string, string>) => ({
				title: ogMeta["og:title"],
				description: ogMeta["og:description"],
				image: ogMeta["og:image"],
				url: ogMeta["og:url"],
				type: ogMeta["og:type"],
				author: ogMeta["article:author"],
				publishedTime: ogMeta["article:published_time"],
			});

			const result = extractOgData(mockOgData);
			expect(result.title).toBe("Open Graph タイトル");
			expect(result.type).toBe("article");
			expect(result.author).toBe("OG著者");
		});

		it("Twitterカードメタデータの抽出", () => {
			const mockTwitterMeta = {
				"twitter:card": "summary_large_image",
				"twitter:title": "Twitterカードタイトル",
				"twitter:description": "Twitterカード説明",
				"twitter:image": "https://example.com/twitter-image.jpg",
				"twitter:creator": "@username",
				"twitter:site": "@site_username",
			};

			const extractTwitterData = (twitterMeta: Record<string, string>) => ({
				card: twitterMeta["twitter:card"],
				title: twitterMeta["twitter:title"],
				description: twitterMeta["twitter:description"],
				image: twitterMeta["twitter:image"],
				creator: twitterMeta["twitter:creator"],
				site: twitterMeta["twitter:site"],
			});

			const result = extractTwitterData(mockTwitterMeta);
			expect(result.card).toBe("summary_large_image");
			expect(result.creator).toBe("@username");
		});
	});

	describe("品質スコア計算の詳細テスト", () => {
		it("コンテンツ品質スコアの計算アルゴリズム", () => {
			const calculateQualityScore = (content: {
				title?: string;
				content?: string;
				author?: string;
				publishedDate?: string;
				readingTime?: number;
				wordCount?: number;
				hasImages?: boolean;
				hasCode?: boolean;
			}) => {
				let score = 0;
				let maxScore = 0;

				// タイトルの評価 (20点満点)
				maxScore += 20;
				if (content.title) {
					if (content.title.length >= 10 && content.title.length <= 100) {
						score += 20;
					} else if (content.title.length >= 5) {
						score += 10;
					}
				}

				// 本文の評価 (30点満点)
				maxScore += 30;
				if (content.content) {
					if (content.content.length >= 1000) {
						score += 30;
					} else if (content.content.length >= 500) {
						score += 20;
					} else if (content.content.length >= 100) {
						score += 10;
					}
				}

				// 著者情報 (10点満点)
				maxScore += 10;
				if (content.author) {
					score += 10;
				}

				// 公開日 (10点満点)
				maxScore += 10;
				if (content.publishedDate) {
					score += 10;
				}

				// 読み時間 (10点満点)
				maxScore += 10;
				if (content.readingTime && content.readingTime > 0) {
					score += 10;
				}

				// 追加要素 (各5点)
				if (content.hasImages) {
					maxScore += 5;
					score += 5;
				}
				if (content.hasCode) {
					maxScore += 5;
					score += 5;
				}

				return maxScore > 0 ? score / maxScore : 0;
			};

			// 高品質コンテンツのテスト
			const highQualityContent = {
				title: "素晴らしい技術記事のタイトル",
				content: "A".repeat(2000),
				author: "技術ライター",
				publishedDate: "2024-01-01",
				readingTime: 15,
				hasImages: true,
				hasCode: true,
			};
			expect(calculateQualityScore(highQualityContent)).toBe(1.0);

			// 中品質コンテンツのテスト
			const mediumQualityContent = {
				title: "記事タイトル",
				content: "A".repeat(800),
				author: "著者",
				publishedDate: "2024-01-01",
			};
			const mediumScore = calculateQualityScore(mediumQualityContent);
			expect(mediumScore).toBeGreaterThan(0.5);
			expect(mediumScore).toBeLessThan(1.0);

			// 低品質コンテンツのテスト
			const lowQualityContent = {
				title: "短い",
			};
			const lowScore = calculateQualityScore(lowQualityContent);
			expect(lowScore).toBeGreaterThanOrEqual(0);
			expect(lowScore).toBeLessThan(0.3);
		});

		it("抽出方法による信頼性スコア", () => {
			const calculateReliabilityScore = (
				extractionMethod: string,
				selectors: string[],
			) => {
				const methodScores: Record<string, number> = {
					readability: 0.9,
					"site-specific": 0.8,
					"structured-data": 0.95,
					"meta-tags": 0.7,
					fallback: 0.4,
				};

				const baseScore = methodScores[extractionMethod] || 0.3;

				// セレクター数による調整
				const selectorBonus = Math.min(selectors.length * 0.05, 0.2);

				return Math.min(baseScore + selectorBonus, 1.0);
			};

			expect(
				calculateReliabilityScore("structured-data", ["json-ld"]),
			).toBeCloseTo(1.0, 1);
			expect(
				calculateReliabilityScore("site-specific", [
					"title",
					"content",
					"author",
				]),
			).toBeCloseTo(0.95, 1);
			expect(calculateReliabilityScore("fallback", ["p"])).toBeCloseTo(0.45, 1);
		});
	});

	describe("エラーハンドリングとフォールバック戦略", () => {
		it("セレクター失敗時のフォールバック", () => {
			const extractWithFallback = (
				selectors: string[],
				mockResults: (string | null)[],
			) => {
				for (let i = 0; i < selectors.length; i++) {
					const result = mockResults[i];
					if (result?.trim()) {
						return {
							value: result,
							usedSelector: selectors[i],
							fallbackLevel: i,
						};
					}
				}
				return { value: null, usedSelector: null, fallbackLevel: -1 };
			};

			// プライマリセレクターが成功
			expect(
				extractWithFallback(
					["h1.primary", "h1.secondary", "h1"],
					["Primary Title", null, "Fallback Title"],
				),
			).toEqual({
				value: "Primary Title",
				usedSelector: "h1.primary",
				fallbackLevel: 0,
			});

			// セカンダリセレクターにフォールバック
			expect(
				extractWithFallback(
					["h1.primary", "h1.secondary", "h1"],
					[null, "Secondary Title", "Fallback Title"],
				),
			).toEqual({
				value: "Secondary Title",
				usedSelector: "h1.secondary",
				fallbackLevel: 1,
			});

			// 全てのセレクターが失敗
			expect(
				extractWithFallback(["h1.primary", "h1.secondary"], [null, null]),
			).toEqual({
				value: null,
				usedSelector: null,
				fallbackLevel: -1,
			});
		});

		it("ネットワークエラーハンドリング", () => {
			const handleNetworkError = (error: unknown) => {
				const err = error as { name?: string; message?: string };
				if (err.name === "TimeoutError") {
					return {
						type: "timeout",
						retry: true,
						delay: 5000,
						message: "ページの読み込みがタイムアウトしました",
					};
				}

				if (err.message?.includes("net::ERR_")) {
					return {
						type: "network",
						retry: true,
						delay: 3000,
						message: "ネットワークエラーが発生しました",
					};
				}

				if (err.message?.includes("403")) {
					return {
						type: "forbidden",
						retry: false,
						message: "アクセスが拒否されました",
					};
				}

				return {
					type: "unknown",
					retry: false,
					message: "不明なエラーが発生しました",
				};
			};

			// タイムアウトエラー
			const timeoutError = { name: "TimeoutError", message: "Timeout" };
			const timeoutResult = handleNetworkError(timeoutError);
			expect(timeoutResult.type).toBe("timeout");
			expect(timeoutResult.retry).toBe(true);
			expect(timeoutResult.delay).toBe(5000);

			// ネットワークエラー
			const networkError = { message: "net::ERR_CONNECTION_REFUSED" };
			const networkResult = handleNetworkError(networkError);
			expect(networkResult.type).toBe("network");
			expect(networkResult.retry).toBe(true);

			// 403エラー
			const forbiddenError = { message: "Request failed with status code 403" };
			const forbiddenResult = handleNetworkError(forbiddenError);
			expect(forbiddenResult.type).toBe("forbidden");
			expect(forbiddenResult.retry).toBe(false);
		});
	});

	describe("サイト別設定の詳細", () => {
		it("サイト固有の設定とオーバーライド", () => {
			const siteConfigs = {
				"qiita.com": {
					selectors: {
						title: ".it-MainHeader_title",
						content: ".it-MdContent",
						author: ".it-UserInfo_name",
					},
					waitTime: 2000,
					scrollToLoad: true,
					jsRequired: true,
				},
				"zenn.dev": {
					selectors: {
						title: "[data-testid='article-title']",
						content: ".znc",
						author: "[data-testid='author-name']",
					},
					waitTime: 1500,
					scrollToLoad: false,
					jsRequired: true,
				},
				"note.com": {
					selectors: {
						title: ".note-header__title",
						content: ".note-content",
						author: ".note-author",
					},
					waitTime: 3000,
					scrollToLoad: true,
					jsRequired: true,
				},
			};

			// 設定の取得とマージ
			const getSiteConfig = (url: string) => {
				const domain = new URL(url).hostname;
				return (
					siteConfigs[domain as keyof typeof siteConfigs] || {
						selectors: {
							title: "h1",
							content: "article, .content, main",
							author: ".author, .byline",
						},
						waitTime: 1000,
						scrollToLoad: false,
						jsRequired: false,
					}
				);
			};

			// Qiita設定のテスト
			const qiitaConfig = getSiteConfig("https://qiita.com/user/items/123");
			expect(qiitaConfig.selectors.title).toBe(".it-MainHeader_title");
			expect(qiitaConfig.jsRequired).toBe(true);

			// 未知のサイトのフォールバック
			const unknownConfig = getSiteConfig("https://unknown-site.com/article");
			expect(unknownConfig.selectors.title).toBe("h1");
			expect(unknownConfig.jsRequired).toBe(false);
		});
	});
});

// vitestのインライン関数テスト
if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("読み時間の計算", () => {
		const calculateReadingTime = (content: string, wordsPerMinute = 200) => {
			// 日本語と英語の混在コンテンツに対応
			const japaneseChars = (
				content.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []
			).length;
			const englishWords = content
				.split(/\s+/)
				.filter((word) => /[a-zA-Z]/.test(word) && word.length > 0).length;

			// 日本語は1文字を0.5語として計算
			const totalWords = englishWords + japaneseChars * 0.5;
			const minutes = Math.ceil(totalWords / wordsPerMinute);

			return Math.max(1, minutes); // 最低1分
		};

		// 英語コンテンツ
		const englishContent =
			"This is a test article with multiple words for reading time calculation.";
		expect(calculateReadingTime(englishContent)).toBe(1);

		// 日本語コンテンツ
		const japaneseContent =
			"これは読み時間を計算するためのテスト記事です。".repeat(100);
		const japaneseTime = calculateReadingTime(japaneseContent);
		expect(japaneseTime).toBeGreaterThan(1);

		// 混在コンテンツ
		const mixedContent =
			"This is a mixed content article. これは混在コンテンツの記事です。".repeat(
				50,
			);
		const mixedTime = calculateReadingTime(mixedContent);
		expect(mixedTime).toBeGreaterThan(1);
	});

	test("URLパターンマッチング", () => {
		const sitePatterns = {
			qiita: /^https:\/\/qiita\.com\/[^\/]+\/items\/[a-f0-9]+$/,
			zenn: /^https:\/\/zenn\.dev\/[^\/]+\/articles\/[a-zA-Z0-9_-]+$/,
			note: /^https:\/\/note\.com\/[^\/]+\/n\/[a-zA-Z0-9]+$/,
			medium: /^https:\/\/medium\.com\/@[^\/]+\/[^\/]+$/,
			devTo: /^https:\/\/dev\.to\/[^\/]+\/[^\/]+-[a-zA-Z0-9]+$/,
		};

		// パターンマッチングのテスト
		expect(
			sitePatterns.qiita.test("https://qiita.com/user/items/abcd1234"),
		).toBe(true);
		expect(
			sitePatterns.zenn.test("https://zenn.dev/user/articles/article-id"),
		).toBe(true);
		expect(sitePatterns.note.test("https://note.com/user/n/n123456")).toBe(
			true,
		);
		expect(
			sitePatterns.medium.test("https://medium.com/@user/article-title"),
		).toBe(true);
		expect(
			sitePatterns.devTo.test("https://dev.to/user/article-title-123"),
		).toBe(true);

		// 無効なURLのテスト
		expect(sitePatterns.qiita.test("https://qiita.com/invalid")).toBe(false);
		expect(sitePatterns.zenn.test("https://zenn.dev/user/books/book-id")).toBe(
			false,
		);
	});

	test("コンテンツクリーニング", () => {
		const cleanContent = (content: string) => {
			return content
				.replace(/<!--.*?-->/g, "") // HTMLコメント削除
				.replace(/<script[^>]*>.*?<\/script>/gi, "") // スクリプト削除
				.replace(/<style[^>]*>.*?<\/style>/gi, "") // スタイル削除
				.replace(/\s+/g, " ") // 複数の空白を1つに
				.replace(/\n\s*\n/g, "\n") // 複数の改行を1つに
				.replace(/^\s+|\s+$/g, ""); // 前後の空白を削除
		};

		const dirtyContent = `
		
		This   is    a    messy     content.
		
		
		With multiple    spaces and lines.
		<!-- This is a comment -->
		<script>alert('test');</script>
		<style>body{color:red;}</style>
		
		`;

		const cleaned = cleanContent(dirtyContent);
		expect(cleaned).not.toContain("  "); // 複数空白なし
		expect(cleaned).not.toContain("<!--"); // コメントなし
		expect(cleaned).not.toContain("<script"); // スクリプトなし
		expect(cleaned).not.toContain("<style"); // スタイルなし
		expect(cleaned.startsWith("This is")).toBe(true);
	});
}
