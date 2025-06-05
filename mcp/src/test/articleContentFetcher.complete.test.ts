/**
 * 記事内容取得機能の包括的テスト
 * src/lib/articleContentFetcher.tsの完全なカバレッジを目的とする
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
	fetchArticleContent,
	generateRatingPrompt,
	type ArticleContent,
} from "../lib/articleContentFetcher.js";

// fetchのモック
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("記事内容取得機能完全テスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("fetchArticleContent", () => {
		it("無効なURLでエラーをスローする", async () => {
			await expect(fetchArticleContent("invalid-url")).rejects.toThrow("Invalid URL");
		});

		it("ブラウザなしでフォールバック取得を実行する", async () => {
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<title>テスト記事タイトル</title>
						<meta name="author" content="テスト著者">
						<meta property="article:published_time" content="2024-01-01T00:00:00Z">
					</head>
					<body>
						<article>
							<h1>記事のメインタイトル</h1>
							<p>これは記事の内容です。技術的な詳細について説明します。</p>
						</article>
					</body>
				</html>
			`;

			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(mockHtml),
			});

			const result = await fetchArticleContent("https://example.com/article");

			expect(result.title).toBe("テスト記事タイトル");
			expect(result.extractionMethod).toBe("fallback-html");
			expect(result.metadata.author).toBe("テスト著者");
			expect(result.metadata.publishedDate).toBe("2024-01-01T00:00:00Z");
		});

		it("フォールバック取得でHTTPエラーの場合例外をスローする", async () => {
			mockFetch.mockResolvedValue({
				ok: false,
				status: 404,
			});

			await expect(
				fetchArticleContent("https://example.com/nonexistent")
			).rejects.toThrow("Fallback fetch failed: HTTP error! status: 404");
		});

		it("フォールバック取得でネットワークエラーの場合例外をスローする", async () => {
			mockFetch.mockRejectedValue(new Error("Network error"));

			await expect(
				fetchArticleContent("https://example.com/article")
			).rejects.toThrow("Fallback fetch failed: Network error");
		});

		it("基本的なHTMLから記事内容を取得する", async () => {
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<title>HTMLテスト記事</title>
						<meta name="author" content="HTML著者">
						<meta property="article:published_time" content="2024-01-01">
					</head>
					<body>
						<main>
							<h1>メインタイトル</h1>
							<p>これはHTMLから抽出された記事の内容です。</p>
							<p>複数の段落があります。</p>
						</main>
					</body>
				</html>
			`;

			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(mockHtml),
			});

			const result = await fetchArticleContent("https://example.com/html-test");

			expect(result.title).toBe("HTMLテスト記事");
			expect(result.content).toContain("メインタイトル");
			expect(result.content).toContain("HTMLから抽出された記事の内容");
			expect(result.metadata.author).toBe("HTML著者");
			expect(result.metadata.publishedDate).toBe("2024-01-01");
		});

		it("titleタグがない場合のデフォルト処理", async () => {
			const mockHtml = `
				<html>
					<body>
						<h1>タイトルなし記事</h1>
						<p>タイトルタグがない記事です。</p>
					</body>
				</html>
			`;

			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(mockHtml),
			});

			const result = await fetchArticleContent("https://example.com/no-title");
			expect(result.title).toBe("記事タイトル不明");
		});

		it("bodyタグがない場合の処理", async () => {
			const mockHtml = `
				<html>
					<head><title>Bodyなし</title></head>
					<div>Body外のコンテンツ</div>
				</html>
			`;

			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(mockHtml),
			});

			const result = await fetchArticleContent("https://example.com/no-body");
			expect(result.title).toBe("Bodyなし");
			expect(result.content).toBe("記事内容の取得に失敗しました");
		});

		it("scriptとstyleタグが除去される", async () => {
			const mockHtml = `
				<html>
					<head><title>スクリプト含み</title></head>
					<body>
						<script>alert('test');</script>
						<style>.test { color: red; }</style>
						<p>通常のコンテンツ</p>
					</body>
				</html>
			`;

			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(mockHtml),
			});

			const result = await fetchArticleContent("https://example.com/with-scripts");
			expect(result.content).not.toContain("alert");
			expect(result.content).not.toContain("color: red");
			expect(result.content).toContain("通常のコンテンツ");
		});

		it("長すぎるコンテンツが2000文字で切り捨てられる", async () => {
			const longContent = "A".repeat(3000);
			const mockHtml = `
				<html>
					<head><title>長い記事</title></head>
					<body>${longContent}</body>
				</html>
			`;

			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(mockHtml),
			});

			const result = await fetchArticleContent("https://example.com/long-content");
			expect(result.content.length).toBeLessThanOrEqual(2000);
			expect(result.content).toContain("A");
		});

		it("メタデータが存在しない場合undefined", async () => {
			const mockHtml = `
				<html>
					<head><title>メタデータなし</title></head>
					<body><p>メタデータがない記事</p></body>
				</html>
			`;

			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(mockHtml),
			});

			const result = await fetchArticleContent("https://example.com/no-metadata");
			expect(result.metadata.author).toBeUndefined();
			expect(result.metadata.publishedDate).toBeUndefined();
		});

		it("読み時間と文字数が計算される", async () => {
			const mockHtml = `
				<html>
					<head><title>計算テスト</title></head>
					<body><p>${"word ".repeat(400)}</p></body>
				</html>
			`;

			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(mockHtml),
			});

			const result = await fetchArticleContent("https://example.com/word-count");
			expect(result.metadata.wordCount).toBeGreaterThan(300);
			expect(result.metadata.readingTime).toBeGreaterThan(1);
		});

		it("非常に短いコンテンツ", async () => {
			const shortHtml = `<html><head><title>短い</title></head><body>短</body></html>`;

			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(shortHtml),
			});

			const result = await fetchArticleContent("http://short.test");
			expect(result.title).toBe("短い");
			expect(result.content).toContain("短");
			expect(result.metadata.wordCount).toBe(1);
			expect(result.metadata.readingTime).toBe(1);
		});

		it("空のHTMLの場合", async () => {
			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(""),
			});

			const result = await fetchArticleContent("https://example.com/empty");
			expect(result.title).toBe("記事タイトル不明");
			expect(result.content).toBe("記事内容の取得に失敗しました");
		});

		it("日本語コンテンツの処理", async () => {
			const japaneseHtml = `
				<html lang="ja">
					<head>
						<title>日本語の記事タイトル</title>
						<meta name="author" content="山田太郎">
					</head>
					<body>
						<p>これは日本語で書かれた技術記事です。文字エンコーディングのテストを行います。</p>
					</body>
				</html>
			`;

			mockFetch.mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(japaneseHtml),
			});

			const result = await fetchArticleContent("https://example.com/japanese");
			expect(result.title).toBe("日本語の記事タイトル");
			expect(result.content).toContain("これは日本語で書かれた技術記事です");
			expect(result.metadata.author).toBe("山田太郎");
		});
	});

	describe("generateRatingPrompt", () => {
		it("完全な記事内容から詳細なプロンプトを生成する", () => {
			const articleContent: ArticleContent = {
				title: "React Hooksの完全ガイド",
				content: "React Hooksは関数コンポーネントで状態管理を行うための仕組みです。useStateやuseEffectなどの基本的なHooksから、カスタムHooksの作成方法まで詳しく解説します。",
				metadata: {
					author: "フロントエンド太郎",
					publishedDate: "2024-01-15",
					readingTime: 15,
					description: "React Hooksの包括的な解説記事",
					wordCount: 1200,
				},
				extractionMethod: "structured-data",
				qualityScore: 0.95,
			};

			const prompt = generateRatingPrompt(
				articleContent,
				"https://example.com/react-hooks"
			);

			expect(prompt).toContain("React Hooksの完全ガイド");
			expect(prompt).toContain("フロントエンド太郎");
			expect(prompt).toContain("2024-01-15");
			expect(prompt).toContain("15分");
			expect(prompt).toContain("約1200文字");
			expect(prompt).toContain("structured-data");
			expect(prompt).toContain("95%");
			expect(prompt).toContain("React Hooksの包括的な解説記事");
			expect(prompt).toContain("React Hooksは関数コンポーネント");
			expect(prompt).toContain("実用性評価 (1-10点)");
			expect(prompt).toContain("技術深度評価 (1-10点)");
			expect(prompt).toContain("理解度評価 (1-10点)");
			expect(prompt).toContain("新規性評価 (1-10点)");
			expect(prompt).toContain("重要度評価 (1-10点)");
			expect(prompt).toContain("JSON形式");
			expect(prompt).toContain("createArticleRating ツール");
		});

		it("記事内容がnullの場合のフォールバックプロンプト", () => {
			const prompt = generateRatingPrompt(
				null,
				"https://example.com/unknown-article"
			);

			expect(prompt).toContain("記事評価タスク（内容取得失敗）");
			expect(prompt).toContain("https://example.com/unknown-article");
			expect(prompt).toContain("記事内容の自動取得に失敗しました");
			expect(prompt).toContain("上記URLにアクセスして記事内容を直接確認し");
			expect(prompt).toContain("実用性") && expect(prompt).toContain("1-10点");
			expect(prompt).toContain("技術深度") && expect(prompt).toContain("1-10点");
			expect(prompt).toContain("理解度") && expect(prompt).toContain("1-10点");
			expect(prompt).toContain("新規性") && expect(prompt).toContain("1-10点");
			expect(prompt).toContain("重要度") && expect(prompt).toContain("1-10点");
			expect(prompt).toContain("JSON形式");
			expect(prompt).toContain("createArticleRating ツール");
		});

		it("部分的なメタデータでもプロンプトを生成する", () => {
			const incompleteContent: ArticleContent = {
				title: "部分的な記事",
				content: "短い内容です。",
				metadata: {
					author: undefined,
					publishedDate: undefined,
					readingTime: 3,
					wordCount: 50,
				},
				extractionMethod: "generic-selectors",
				qualityScore: 0.4,
			};

			const prompt = generateRatingPrompt(
				incompleteContent,
				"https://example.com/partial"
			);

			expect(prompt).toContain("部分的な記事");
			expect(prompt).toContain("N/A"); // 著者と公開日
			expect(prompt).toContain("3分"); // 読み時間
			expect(prompt).toContain("約50文字");
			expect(prompt).toContain("generic-selectors");
			expect(prompt).toContain("40%");
			expect(prompt).toContain("短い内容です");
		});

		it("空の記事内容でもプロンプトを生成する", () => {
			const emptyContent: ArticleContent = {
				title: "",
				content: "",
				metadata: {},
				extractionMethod: "fallback-html",
				qualityScore: 0.1,
			};

			const prompt = generateRatingPrompt(
				emptyContent,
				"https://example.com/empty"
			);

			expect(prompt).toContain("N/A"); // 各種メタデータ
			expect(prompt).toContain("fallback-html");
			expect(prompt).toContain("10%");
		});

		it("長い記事内容を適切にトリミングする", () => {
			const longContent = "A".repeat(3000); // 3000文字の長いコンテンツ
			const articleContent: ArticleContent = {
				title: "長い記事",
				content: longContent,
				metadata: {
					author: "長文作者",
					publishedDate: "2024-01-01",
					readingTime: 30,
					wordCount: 3000,
				},
				extractionMethod: "semantic-elements",
				qualityScore: 0.8,
			};

			const prompt = generateRatingPrompt(
				articleContent,
				"https://example.com/long"
			);

			// 内容が2000文字でトリミングされ、"..."が追加されることを確認
			expect(prompt).toContain("A".repeat(2000) + "...");
			expect(prompt).not.toContain("A".repeat(2500));
		});
	});

	describe("型の整合性", () => {
		it("ArticleContentの型が正しく定義されている", () => {
			const validContent: ArticleContent = {
				title: "テストタイトル",
				content: "テスト内容",
				metadata: {
					author: "テスト著者",
					publishedDate: "2024-01-01",
					readingTime: 5,
					wordCount: 100,
				},
				extractionMethod: "test-method",
				qualityScore: 0.8,
			};

			expect(validContent.title).toBe("テストタイトル");
			expect(validContent.content).toBe("テスト内容");
			expect(validContent.metadata.author).toBe("テスト著者");
			expect(validContent.extractionMethod).toBe("test-method");
			expect(validContent.qualityScore).toBe(0.8);
		});

		it("optionalなメタデータが正しく処理される", () => {
			const contentWithOptionals: ArticleContent = {
				title: "オプショナルテスト",
				content: "オプション値テスト",
				metadata: {
					author: undefined,
					publishedDate: undefined,
					tags: [],
					description: undefined,
				},
				extractionMethod: "test",
				qualityScore: 0.5,
			};

			expect(contentWithOptionals.metadata.author).toBeUndefined();
			expect(contentWithOptionals.metadata.publishedDate).toBeUndefined();
			expect(contentWithOptionals.metadata.tags).toEqual([]);

			// generateRatingPromptでもundefined値が適切に処理されることを確認
			const prompt = generateRatingPrompt(contentWithOptionals, "https://example.com");
			expect(prompt).toContain("N/A");
		});
	});

	describe("パフォーマンス考慮", () => {
		it("大量のテキストのプロンプト生成", () => {
			const largeContent: ArticleContent = {
				title: "大きな記事",
				content: "テスト ".repeat(10000), // 非常に長いコンテンツ
				metadata: {
					wordCount: 10000,
					readingTime: 50,
				},
				extractionMethod: "performance-test",
				qualityScore: 0.7,
			};

			const startTime = Date.now();
			const prompt = generateRatingPrompt(largeContent, "https://example.com/large");
			const endTime = Date.now();

			expect(prompt).toContain("大きな記事");
			expect(endTime - startTime).toBeLessThan(100); // 100ms以内
			expect(prompt.length).toBeLessThan(10000); // プロンプトサイズが適切
		});
	});
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("記事内容取得機能完全テストファイルが正しく設定されている", () => {
		expect(typeof fetchArticleContent).toBe("function");
		expect(typeof generateRatingPrompt).toBe("function");
	});

	test("ArticleContent型が適切に定義されている", () => {
		const testContent: ArticleContent = {
			title: "テスト",
			content: "内容",
			metadata: {
				author: "著者",
				publishedDate: "2024-01-01",
				readingTime: 5,
			},
			extractionMethod: "test",
			qualityScore: 0.8,
		};
		expect(testContent).toBeDefined();
	});
}