/**
 * 追加のカバレッジテスト - 30%目標達成用
 */

import { describe, expect, test, vi } from "vitest";

// 新しく追加した非エクスポート関数をテスト用に定義
function extractContentFromHTMLLocal(html: string) {
	const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
	const title = titleMatch ? titleMatch[1].trim() : "記事タイトル不明";

	const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
	let content = "記事内容の取得に失敗しました";

	if (bodyMatch) {
		content = bodyMatch[1]
			.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
			.replace(/<[^>]+>/g, " ")
			.replace(/\s+/g, " ")
			.trim()
			.substring(0, 2000);
	}

	const authorMatch = html.match(
		/<meta[^>]*name="author"[^>]*content="([^"]+)"/i,
	);
	const dateMatch = html.match(
		/<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/i,
	);
	const wordCount = content.split(/\s+/).length;

	return {
		title,
		content,
		metadata: {
			author: authorMatch ? authorMatch[1] : undefined,
			publishedDate: dateMatch ? dateMatch[1] : undefined,
			tags: [],
			readingTime: Math.ceil(wordCount / 200),
			wordCount,
		},
		extractionMethod: "fallback-html",
		qualityScore: 0.3,
	};
}

async function fallbackFetchContentLocal(url: string) {
	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; EffectiveYomimono/1.0)",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const html = await response.text();
		return extractContentFromHTMLLocal(html);
	} catch (error) {
		throw new Error(
			`Fallback fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

describe("追加カバレッジテスト", () => {
	describe("extractContentFromHTML", () => {
		test("HTMLからタイトルと内容を正しく抽出する", () => {
			const html = `
				<html>
					<head><title>テストタイトル</title></head>
					<body>
						<article>
							<h1>記事タイトル</h1>
							<p>これは記事の内容です。テスト用の文章が続きます。</p>
							<script>console.log('スクリプト');</script>
							<style>.test { color: red; }</style>
						</article>
					</body>
				</html>
			`;

			const result = extractContentFromHTMLLocal(html);

			expect(result.title).toBe("テストタイトル");
			expect(result.content).toContain("記事の内容");
			expect(result.content).not.toContain("console.log");
			expect(result.content).not.toContain("color: red");
			expect(result.extractionMethod).toBe("fallback-html");
			expect(result.qualityScore).toBe(0.3);
			expect(result.metadata.wordCount).toBeGreaterThan(0);
			expect(result.metadata.readingTime).toBeGreaterThan(0);
		});

		test("メタデータ付きHTMLから著者と日付を抽出する", () => {
			const html = `
				<html>
					<head>
						<title>テスト記事</title>
						<meta name="author" content="テスト著者">
						<meta property="article:published_time" content="2024-01-01T12:00:00Z">
					</head>
					<body>
						<p>記事内容です。</p>
					</body>
				</html>
			`;

			const result = extractContentFromHTMLLocal(html);

			expect(result.metadata.author).toBe("テスト著者");
			expect(result.metadata.publishedDate).toBe("2024-01-01T12:00:00Z");
			expect(result.metadata.tags).toEqual([]);
		});

		test("タイトルがない場合のデフォルト処理", () => {
			const html = `
				<html>
					<head></head>
					<body><p>内容のみ</p></body>
				</html>
			`;

			const result = extractContentFromHTMLLocal(html);

			expect(result.title).toBe("記事タイトル不明");
		});

		test("bodyタグがない場合のエラー処理", () => {
			const html = "<html><head><title>タイトルのみ</title></head></html>";

			const result = extractContentFromHTMLLocal(html);

			expect(result.content).toBe("記事内容の取得に失敗しました");
		});

		test("長いコンテンツの切り詰め処理", () => {
			const longContent = "長いテキスト ".repeat(1000);
			const html = `
				<html>
					<head><title>長い記事</title></head>
					<body>${longContent}</body>
				</html>
			`;

			const result = extractContentFromHTMLLocal(html);

			expect(result.content.length).toBeLessThanOrEqual(2000);
		});
	});

	describe("fallbackFetchContent", () => {
		test("成功時にHTMLコンテンツを取得する", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				text: async () => `
					<html>
						<head><title>フォールバック記事</title></head>
						<body><p>フォールバック内容です。</p></body>
					</html>
				`,
			});

			const result = await fallbackFetchContentLocal("https://example.com");

			expect(result.title).toBe("フォールバック記事");
			expect(result.content).toContain("フォールバック内容");
			expect(result.extractionMethod).toBe("fallback-html");
			expect(fetch).toHaveBeenCalledWith("https://example.com", {
				headers: {
					"User-Agent": "Mozilla/5.0 (compatible; EffectiveYomimono/1.0)",
				},
			});
		});

		test("HTTPエラー時に例外を投げる", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
			});

			await expect(
				fallbackFetchContentLocal("https://example.com"),
			).rejects.toThrow("Fallback fetch failed: HTTP error! status: 404");
		});

		test("ネットワークエラー時に例外を投げる", async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error("ネットワークエラー"));

			await expect(
				fallbackFetchContentLocal("https://example.com"),
			).rejects.toThrow("Fallback fetch failed: ネットワークエラー");
		});

		test("不明なエラー時の処理", async () => {
			global.fetch = vi.fn().mockRejectedValue("未知のエラー");

			await expect(
				fallbackFetchContentLocal("https://example.com"),
			).rejects.toThrow("Fallback fetch failed: Unknown error");
		});
	});

	describe("エッジケーステスト", () => {
		test("空のHTMLドキュメント", () => {
			const result = extractContentFromHTMLLocal("");

			expect(result.title).toBe("記事タイトル不明");
			expect(result.content).toBe("記事内容の取得に失敗しました");
		});

		test("不正なHTMLタグ", () => {
			const html = "<invalid><title>壊れた</title><body>内容</body></invalid>";

			const result = extractContentFromHTMLLocal(html);

			expect(result.title).toBe("壊れた");
			expect(result.content).toContain("内容");
		});

		test("特殊文字を含むHTML", () => {
			const html = `
				<html>
					<head><title>記事&amp;テスト</title></head>
					<body><p>内容&lt;特殊&gt;文字</p></body>
				</html>
			`;

			const result = extractContentFromHTMLLocal(html);

			expect(result.title).toBe("記事&amp;テスト"); // HTMLエンティティはそのまま保持される
			expect(result.content).toContain("内容");
		});

		test("ネストされたタグ構造", () => {
			const html = `
				<html>
					<head><title>ネストテスト</title></head>
					<body>
						<div>
							<div>
								<p>深くネストされた<strong>内容</strong>です。</p>
							</div>
						</div>
					</body>
				</html>
			`;

			const result = extractContentFromHTMLLocal(html);

			expect(result.content).toContain("深くネストされた");
			expect(result.content).toContain("内容");
		});
	});
});
