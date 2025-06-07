/**
 * Issue #590: articleContentFetcher.tsのカバレッジ向上
 * 基本的なエラーハンドリングとプロンプト生成をテスト
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ArticleContent,
	fetchArticleContent,
	generateRatingPrompt,
} from "../lib/articleContentFetcher.js";

// fetch のモック
global.fetch = vi.fn();

describe("Issue #590: ArticleContentFetcher カバレッジ向上", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("基本的な記事抽出テスト", () => {
		it("基本的なHTML記事の抽出", async () => {
			const basicHTML = `
				<!DOCTYPE html>
				<html>
					<head>
						<title>基本記事タイトル</title>
						<meta property="article:published_time" content="2024-01-01T00:00:00Z">
					</head>
					<body>
						<article>
							<h1>記事タイトル</h1>
							<p>記事の内容です。</p>
						</article>
					</body>
				</html>
			`;

			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				headers: new Map([["content-type", "text/html"]]),
				text: async () => basicHTML,
			});

			const result = await fetchArticleContent("https://example.com/article");

			expect(result.title).toBeTruthy();
			expect(result.content).toBeTruthy();
			expect(result.extractionMethod).toBeTruthy();
			expect(result.qualityScore).toBeGreaterThanOrEqual(0);
		});

		it("HTMLパースエラーの場合", async () => {
			(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				headers: new Map([["content-type", "text/html"]]),
				text: async () => {
					throw new Error("Parse error");
				},
			});

			await expect(
				fetchArticleContent("https://example.com/parse-error"),
			).rejects.toThrow();
		});
	});

	describe("generateRatingPrompt の詳細テスト", () => {
		it("記事内容なしでのプロンプト生成", () => {
			const prompt = generateRatingPrompt(null, "https://example.com/article");

			expect(prompt).toContain("https://example.com/article");
			expect(prompt).toBeTruthy();
			expect(typeof prompt).toBe("string");
		});

		it("完全な記事情報でのプロンプト生成", () => {
			const articleContent: ArticleContent = {
				title: "高度なTypeScript型定義",
				content: "TypeScriptの高度な型定義テクニックについて...",
				metadata: {
					author: "技術太郎",
					publishedDate: "2024-01-01",
					tags: ["TypeScript", "型定義", "プログラミング"],
					readingTime: 15,
					wordCount: 3000,
					description: "TypeScriptの高度な型定義を解説",
				},
				extractionMethod: "structured-data",
				qualityScore: 0.95,
			};

			const prompt = generateRatingPrompt(
				articleContent,
				"https://example.com/ts-article",
			);

			expect(prompt).toContain("高度なTypeScript型定義");
			expect(prompt).toContain("https://example.com/ts-article");
			expect(prompt).toContain("技術太郎");
			expect(prompt).toContain("TypeScript");
			expect(typeof prompt).toBe("string");
		});

		it("部分的なメタデータでのプロンプト生成", () => {
			const articleContent: ArticleContent = {
				title: "部分的な記事",
				content: "内容の一部のみ",
				metadata: {
					author: undefined,
					publishedDate: undefined,
					tags: [],
					readingTime: undefined,
					wordCount: undefined,
					description: undefined,
				},
				extractionMethod: "fallback",
				qualityScore: 0.3,
			};

			const prompt = generateRatingPrompt(
				articleContent,
				"https://example.com/partial",
			);

			expect(prompt).toContain("部分的な記事");
			expect(prompt).toContain("内容の一部のみ");
			expect(typeof prompt).toBe("string");
		});
	});
});

// getReadBookmarks のエラーハンドリングテスト
describe("getReadBookmarks カバレッジテスト", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.env.API_BASE_URL = "https://api.example.com";
	});

	it("APIエラー時の処理（lines 556-557）", async () => {
		const { getReadBookmarks } = await import("../lib/apiClient.js");

		(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: "Internal Server Error",
		});

		await expect(getReadBookmarks()).rejects.toThrow(
			"Failed to fetch read bookmarks: Internal Server Error",
		);
	});

	it("Zodスキーマ検証エラー（lines 562-565）", async () => {
		const { getReadBookmarks } = await import("../lib/apiClient.js");

		(fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				// successフィールドが欠けている
				bookmarks: [],
			}),
		});

		await expect(getReadBookmarks()).rejects.toThrow(
			"Invalid API response for read bookmarks:",
		);
	});
});

// vitestのインライン関数テスト
if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("URL判定ロジック", () => {
		const isValidUrl = (url: string): boolean => {
			try {
				new URL(url);
				return true;
			} catch {
				return false;
			}
		};

		expect(isValidUrl("https://example.com")).toBe(true);
		expect(isValidUrl("http://localhost:3000")).toBe(true);
		expect(isValidUrl("not-a-url")).toBe(false);
		expect(isValidUrl("")).toBe(false);
	});

	test("読了時間計算ロジック", () => {
		const calculateReadingTime = (text: string): number => {
			const japaneseChars = (
				text.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g) ||
				[]
			).length;
			const words = text.split(/\s+/).filter((word) => word.length > 0).length;
			const readingSpeed = japaneseChars > words * 2 ? 600 : 200;
			const totalWords = japaneseChars > words * 2 ? japaneseChars : words;
			return Math.max(1, Math.ceil(totalWords / readingSpeed));
		};

		expect(calculateReadingTime("あ".repeat(600))).toBe(1);
		expect(calculateReadingTime("word ".repeat(200))).toBe(1);
		expect(calculateReadingTime("短い")).toBe(1);
	});
}
