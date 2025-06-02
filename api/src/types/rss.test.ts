/**
 * RSS型定義のテストコード
 */
import { describe, expect, it } from "vitest";
import type { Article } from "./rss";

describe("RSS Types", () => {
	describe("Article interface", () => {
		it("必須プロパティを含む記事オブジェクトを作成できること", () => {
			const article: Article = {
				guid: "article-123",
				url: "https://example.com/article",
				title: "Test Article",
			};

			expect(article.guid).toBe("article-123");
			expect(article.url).toBe("https://example.com/article");
			expect(article.title).toBe("Test Article");
		});

		it("オプショナルプロパティを含む完全な記事オブジェクトを作成できること", () => {
			const article: Article = {
				guid: "article-456",
				url: "https://example.com/full-article",
				title: "Full Test Article",
				description: "This is a test article description",
				publishedAt: new Date("2024-01-01T00:00:00Z"),
				author: "Test Author",
				categories: ["Technology", "Programming"],
			};

			expect(article.guid).toBe("article-456");
			expect(article.url).toBe("https://example.com/full-article");
			expect(article.title).toBe("Full Test Article");
			expect(article.description).toBe("This is a test article description");
			expect(article.publishedAt).toEqual(new Date("2024-01-01T00:00:00Z"));
			expect(article.author).toBe("Test Author");
			expect(article.categories).toEqual(["Technology", "Programming"]);
		});

		it("undefinedのオプショナルプロパティを含む記事オブジェクトを作成できること", () => {
			const article: Article = {
				guid: "article-789",
				url: "https://example.com/minimal-article",
				title: "Minimal Article",
				description: undefined,
				publishedAt: undefined,
				author: undefined,
				categories: undefined,
			};

			expect(article.description).toBeUndefined();
			expect(article.publishedAt).toBeUndefined();
			expect(article.author).toBeUndefined();
			expect(article.categories).toBeUndefined();
		});
	});
});

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;
	test("Article型のタイプチェック", () => {
		// TypeScriptのコンパイル時型チェックをテスト
		const validArticle: Article = {
			guid: "test-guid",
			url: "https://test.com",
			title: "Test Title",
		};
		expect(validArticle).toBeDefined();
	});
}
