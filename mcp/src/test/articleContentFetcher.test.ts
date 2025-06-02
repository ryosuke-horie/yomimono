/**
 * 記事内容取得機能のテスト
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ArticleContent,
	fetchArticleContent,
	generateRatingPrompt,
} from "../lib/articleContentFetcher.js";

// Mock fetch globally
global.fetch = vi.fn();

describe("fetchArticleContent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("有効なURLから記事内容を正常に取得する", async () => {
		const mockHtml = `
			<html>
				<head>
					<title>テスト記事タイトル</title>
					<meta name="author" content="テスト著者">
					<meta property="article:published_time" content="2024-01-01T00:00:00Z">
				</head>
				<body>
					<article>
						<h1>記事タイトル</h1>
						<p>これはテスト記事の内容です。プログラミングに関する技術的な内容を含みます。</p>
					</article>
				</body>
			</html>
		`;

		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: true,
			text: async () => mockHtml,
		});

		const url = "https://example.com/article";
		const result = await fetchArticleContent(url);

		expect(result).toMatchObject({
			title: expect.any(String),
			content: expect.any(String),
			metadata: {
				author: expect.any(String),
				publishedDate: expect.any(String),
				tags: expect.any(Array),
				readingTime: expect.any(Number),
			},
		});
		expect(result.title).toBe("テスト記事タイトル");
		expect(result.content).toContain("記事タイトル");
		expect(result.metadata.author).toBe("テスト著者");
		expect(result.content.length).toBeGreaterThan(0);
	});

	it("無効なURLでエラーを投げる", async () => {
		const invalidUrl = "invalid-url";
		await expect(fetchArticleContent(invalidUrl)).rejects.toThrow(
			"Invalid URL",
		);
	});

	it("存在しないURLで適切なエラーを投げる", async () => {
		// biome-ignore lint/suspicious/noExplicitAny: テスト用のfetchモックのため
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 404,
		});

		const notFoundUrl = "https://example.com/not-found";
		await expect(fetchArticleContent(notFoundUrl)).rejects.toThrow(
			"HTTP error! status: 404",
		);
	});
});

describe("generateRatingPrompt", () => {
	const sampleArticle: ArticleContent = {
		title: "サンプル記事",
		content: "これはサンプルの記事内容です。技術的な内容を含みます。",
		metadata: {
			author: "著者名",
			publishedDate: "2024-01-01",
			tags: ["JavaScript", "技術"],
			readingTime: 5,
		},
	};

	it("記事内容から適切な評価プロンプトを生成する", () => {
		const url = "https://example.com/article";
		const prompt = generateRatingPrompt(sampleArticle, url);

		expect(prompt).toContain("記事の内容を5つの軸で評価してください");
		expect(prompt).toContain(sampleArticle.title);
		expect(prompt).toContain(url);
		expect(prompt).toContain(sampleArticle.content);
		expect(prompt).toContain("実用性");
		expect(prompt).toContain("技術深度");
		expect(prompt).toContain("理解度");
		expect(prompt).toContain("新規性");
		expect(prompt).toContain("重要度");
	});

	it("記事内容がnullの場合でもプロンプトを生成する", () => {
		const url = "https://example.com/article";
		const prompt = generateRatingPrompt(null, url);

		expect(prompt).toContain("記事の内容を5つの軸で評価してください");
		expect(prompt).toContain(url);
		expect(prompt).toContain("記事内容の取得に失敗しました");
	});

	it("メタデータが不完全でもプロンプトを生成する", () => {
		const incompleteArticle: ArticleContent = {
			title: "サンプル記事",
			content: "内容",
			metadata: {
				readingTime: 3,
			},
		};
		const url = "https://example.com/article";
		const prompt = generateRatingPrompt(incompleteArticle, url);

		expect(prompt).toContain(incompleteArticle.title);
		expect(prompt).toContain("N/A"); // 不足データのデフォルト値
	});
});
