/**
 * articleContentFetcher.ts 内部関数の包括的テスト
 * fallbackFetchContent, extractContentFromHTML 等の詳細カバレッジ向上
 */

import { beforeEach, describe, expect, test, vi } from "vitest";

// fetchをモック
global.fetch = vi.fn();

describe("ArticleContentFetcher Internal Functions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("fallbackFetchContent 関数の詳細テスト", () => {
		test("正常なHTTPレスポンス処理", async () => {
			const { fetchArticleContent } = await import(
				"../lib/articleContentFetcher.js"
			);

			// 成功レスポンスをモック
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				text: async () => `
					<html>
						<head>
							<title>フォールバックテスト記事</title>
							<meta name="author" content="テスト著者">
							<meta property="article:published_time" content="2024-01-01T00:00:00Z">
						</head>
						<body>
							<h1>記事タイトル</h1>
							<p>これはフォールバック取得のテスト記事です。</p>
							<script>console.log('削除対象');</script>
							<style>.test { color: red; }</style>
						</body>
					</html>
				`,
			} as unknown as Response);

			// ブラウザなしでフォールバック処理を実行
			const result = await fetchArticleContent("https://test.example.com");

			expect(result.title).toBe("フォールバックテスト記事");
			expect(result.extractionMethod).toBe("fallback-html");
			expect(result.metadata.author).toBe("テスト著者");
			expect(result.metadata.publishedDate).toBe("2024-01-01T00:00:00Z");
			expect(result.content).toContain("フォールバック取得");
			expect(result.content).not.toContain("console.log");
			expect(result.content).not.toContain("color: red");
			expect(result.qualityScore).toBe(0.3);
		});

		test("HTTPエラーレスポンスの処理", async () => {
			const { fetchArticleContent } = await import(
				"../lib/articleContentFetcher.js"
			);

			// 404エラーをモック
			vi.mocked(fetch).mockResolvedValue({
				ok: false,
				status: 404,
			} as unknown as Response);

			await expect(fetchArticleContent("https://notfound.com")).rejects.toThrow(
				"HTTP error! status: 404",
			);

			expect(fetch).toHaveBeenCalledWith(
				"https://notfound.com",
				expect.objectContaining({
					headers: expect.objectContaining({
						"User-Agent": "Mozilla/5.0 (compatible; EffectiveYomimono/1.0)",
					}),
				}),
			);
		});

		test("ネットワークエラーの処理", async () => {
			const { fetchArticleContent } = await import(
				"../lib/articleContentFetcher.js"
			);

			// ネットワークエラーをモック
			vi.mocked(fetch).mockRejectedValue(new Error("Network timeout"));

			await expect(fetchArticleContent("https://timeout.com")).rejects.toThrow(
				"Fallback fetch failed: Network timeout",
			);
		});

		test("最小限のHTMLからの抽出", async () => {
			const { fetchArticleContent } = await import(
				"../lib/articleContentFetcher.js"
			);

			// 最小限のHTMLをモック
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				text: async () =>
					`<html><head><title>最小</title></head><body>内容</body></html>`,
			} as unknown as Response);

			const result = await fetchArticleContent("https://minimal.com");

			expect(result.title).toBe("最小");
			expect(result.content).toBe("内容");
			expect(result.metadata.author).toBeUndefined();
			expect(result.metadata.publishedDate).toBeUndefined();
		});
	});

	describe("extractContentFromHTML 関数の詳細テスト", () => {
		test("複雑なHTMLからの抽出", async () => {
			const { fetchArticleContent } = await import(
				"../lib/articleContentFetcher.js"
			);

			const complexHtml = `
				<!DOCTYPE html>
				<html lang="ja">
				<head>
					<title>複雑なHTMLテスト</title>
					<meta name="author" content="複雑著者">
					<meta property="article:published_time" content="2024-02-01T12:00:00Z">
					<script src="analytics.js"></script>
					<style>
						body { font-family: Arial; }
						.hidden { display: none; }
					</style>
				</head>
				<body>
					<header>
						<nav>ナビゲーション</nav>
					</header>
					<main>
						<article>
							<h1>メインタイトル</h1>
							<p>第一段落の内容です。</p>
							<p>第二段落の内容です。</p>
							<div class="code-block">
								<pre><code>console.log('コード例');</code></pre>
							</div>
							<p>最後の段落です。</p>
						</article>
					</main>
					<aside>
						<p>サイドバー内容</p>
					</aside>
					<footer>
						<p>フッター</p>
					</footer>
					<script>
						function trackEvent() {
							console.log('削除されるべきスクリプト');
						}
					</script>
				</body>
				</html>
			`;

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				text: async () => complexHtml,
			} as unknown as Response);

			const result = await fetchArticleContent("https://complex.com");

			expect(result.title).toBe("複雑なHTMLテスト");
			expect(result.metadata.author).toBe("複雑著者");
			expect(result.metadata.publishedDate).toBe("2024-02-01T12:00:00Z");
			expect(result.content).toContain("第一段落");
			expect(result.content).toContain("第二段落");
			expect(result.content).toContain("最後の段落");
			expect(result.content).not.toContain("trackEvent");
			expect(result.content).not.toContain("font-family");
			// フォールバック取得では全bodyが含まれるため、ナビゲーションも含まれる
			expect(result.content).toContain("第一段落");
			expect(result.metadata.wordCount).toBeGreaterThan(0);
			expect(result.metadata.readingTime).toBeGreaterThan(0);
		});

		test("不完全なHTMLの処理", async () => {
			const { fetchArticleContent } = await import(
				"../lib/articleContentFetcher.js"
			);

			const brokenHtml = `
				<html>
				<head>
					<title>不完全HTML
				</head>
				<body>
					<p>閉じタグなし
					<div>ネストした内容
						<span>さらにネスト</span>
					</div>
				</body>
			`;

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				text: async () => brokenHtml,
			} as unknown as Response);

			const result = await fetchArticleContent("https://broken.com");

			// 不完全なtitleタグの場合、「記事タイトル不明」になる
			expect(result.title).toBe("記事タイトル不明");
			expect(result.content).toContain("閉じタグなし");
			expect(result.content).toContain("ネストした内容");
			expect(result.extractionMethod).toBe("fallback-html");
		});

		test("メタデータなしHTMLの処理", async () => {
			const { fetchArticleContent } = await import(
				"../lib/articleContentFetcher.js"
			);

			const noMetaHtml = `
				<html>
				<head><title>メタなし</title></head>
				<body>
					<h1>記事タイトル</h1>
					<p>メタデータのない記事です。</p>
				</body>
				</html>
			`;

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				text: async () => noMetaHtml,
			} as unknown as Response);

			const result = await fetchArticleContent("https://nometa.com");

			expect(result.title).toBe("メタなし");
			expect(result.metadata.author).toBeUndefined();
			expect(result.metadata.publishedDate).toBeUndefined();
			expect(result.content).toContain("メタデータのない");
		});

		test("空のbodyタグの処理", async () => {
			const { fetchArticleContent } = await import(
				"../lib/articleContentFetcher.js"
			);

			const emptyBodyHtml = `
				<html>
				<head><title>空Body</title></head>
				<body></body>
				</html>
			`;

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				text: async () => emptyBodyHtml,
			} as unknown as Response);

			const result = await fetchArticleContent("https://empty.com");

			expect(result.title).toBe("空Body");
			// 空のbodyの場合は空文字列になる
			expect(result.content).toBe("");
		});
	});

	describe("品質スコア計算の包括的テスト", () => {
		test("calculateQualityScore の詳細実行", async () => {
			const { fetchArticleContent } = await import(
				"../lib/articleContentFetcher.js"
			);

			// 様々な品質レベルのコンテンツをテスト
			const testCases = [
				{
					html: `<html><head><title>短い</title></head><body><p>短</p></body></html>`,
					expectedRange: [0.3, 0.35], // 基本スコア
				},
				{
					html: `<html><head><title>中程度</title></head><body>${"<p>中程度の長さの記事内容です。".repeat(10)}</p></body></html>`,
					expectedRange: [0.3, 0.35], // フォールバック固定スコア
				},
				{
					html: `<html><head><title>長い</title><meta name="author" content="著者"></head><body>${"<p>非常に長い記事内容です。".repeat(50)}</p></body></html>`,
					expectedRange: [0.3, 0.35], // フォールバック固定スコア
				},
			];

			for (let i = 0; i < testCases.length; i++) {
				const testCase = testCases[i];

				vi.mocked(fetch).mockResolvedValue({
					ok: true,
					text: async () => testCase.html,
				} as unknown as Response);

				const result = await fetchArticleContent(`https://quality${i}.com`);

				expect(result.qualityScore).toBeGreaterThanOrEqual(
					testCase.expectedRange[0],
				);
				expect(result.qualityScore).toBeLessThanOrEqual(
					testCase.expectedRange[1],
				);
			}
		});
	});

	describe("長いコンテンツの切り詰め処理", () => {
		test("2000文字制限の確認", async () => {
			const { fetchArticleContent } = await import(
				"../lib/articleContentFetcher.js"
			);

			// 2000文字を超える長いコンテンツ
			const longContent = "あ".repeat(3000);
			const longHtml = `
				<html>
				<head><title>長文記事</title></head>
				<body><article>${longContent}</article></body>
				</html>
			`;

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				text: async () => longHtml,
			} as unknown as Response);

			const result = await fetchArticleContent("https://longcontent.com");

			// フォールバックでは2000文字制限が適用される
			expect(result.content.length).toBeLessThanOrEqual(2000);
			expect(result.title).toBe("長文記事");
			expect(result.metadata.wordCount).toBeGreaterThan(0);
		});
	});

	describe("特殊文字とエンコーディング処理", () => {
		test("日本語コンテンツの処理", async () => {
			const { fetchArticleContent } = await import(
				"../lib/articleContentFetcher.js"
			);

			const japaneseHtml = `
				<html>
				<head>
					<title>日本語記事のテスト</title>
					<meta name="author" content="山田太郎">
					<meta charset="UTF-8">
				</head>
				<body>
					<h1>技術記事のタイトル</h1>
					<p>これは日本語の技術記事です。プログラミングについて説明します。</p>
					<p>コード例：<code>const message = "こんにちは";</code></p>
					<p>特殊文字：①②③、♪♫♬、→←↑↓</p>
				</body>
				</html>
			`;

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				text: async () => japaneseHtml,
			} as unknown as Response);

			const result = await fetchArticleContent("https://japanese.com");

			expect(result.title).toBe("日本語記事のテスト");
			expect(result.metadata.author).toBe("山田太郎");
			expect(result.content).toContain("日本語の技術記事");
			expect(result.content).toContain("こんにちは");
			expect(result.content).toContain("①②③");
			expect(result.content).toContain("→←↑↓");
		});

		test("HTMLエンティティの処理", async () => {
			const { fetchArticleContent } = await import(
				"../lib/articleContentFetcher.js"
			);

			const entityHtml = `
				<html>
				<head><title>エンティティ&amp;テスト</title></head>
				<body>
					<p>&lt;script&gt;alert(&quot;test&quot;);&lt;/script&gt;</p>
					<p>&amp;nbsp;&amp;copy;&amp;reg;&amp;trade;</p>
					<p>Math: 2 &lt; 3 &amp;&amp; 5 &gt; 4</p>
				</body>
				</html>
			`;

			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				text: async () => entityHtml,
			} as unknown as Response);

			const result = await fetchArticleContent("https://entities.com");

			expect(result.title).toContain("エンティティ");
			expect(result.title).toContain("テスト");
			expect(result.content).toContain("script");
			expect(result.content).toContain("alert");
		});
	});
});

if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("内部関数モジュール確認", () => {
		test("インポート可能性確認", async () => {
			const module = await import("../lib/articleContentFetcher.js");
			expect(typeof module.fetchArticleContent).toBe("function");
			expect(typeof module.generateRatingPrompt).toBe("function");
		});
	});
}
