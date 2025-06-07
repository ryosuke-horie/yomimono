/**
 * Claude Code カスタムコマンドの型定義
 */
import { z } from "zod";

// 記事評価コマンドのオプション
export const RateArticleOptionsSchema = z.object({
	url: z.string().url().optional(),
	articleId: z.number().optional(),
	autoEvaluate: z.boolean().default(false),
	skipConfirmation: z.boolean().default(false),
	outputFormat: z.enum(["json", "text", "summary"]).default("text"),
});

export type RateArticleOptions = z.infer<typeof RateArticleOptionsSchema>;

// バッチ評価コマンドのオプション
export const BatchRateOptionsSchema = z.object({
	urlsFile: z.string(),
	concurrency: z.number().min(1).max(10).default(3),
	skipExisting: z.boolean().default(false),
	outputFile: z.string().optional(),
});

export type BatchRateOptions = z.infer<typeof BatchRateOptionsSchema>;

// 記事情報
export const ArticleInfoSchema = z.object({
	id: z.number(),
	title: z.string(),
	url: z.string().url(),
	createdAt: z.string(),
});

export type ArticleInfo = z.infer<typeof ArticleInfoSchema>;

// 記事内容
export const ArticleContentSchema = z.object({
	title: z.string(),
	content: z.string(),
	wordCount: z.number(),
	summary: z.string().optional(),
	url: z.string().url(),
});

export type ArticleContent = z.infer<typeof ArticleContentSchema>;

// 評価結果
export const RatingResultSchema = z.object({
	practicalValue: z.number().min(1).max(10),
	technicalDepth: z.number().min(1).max(10),
	understanding: z.number().min(1).max(10),
	novelty: z.number().min(1).max(10),
	importance: z.number().min(1).max(10),
	totalScore: z.number().min(1).max(10),
	comment: z.string().optional(),
});

export type RatingResult = z.infer<typeof RatingResultSchema>;

// 保存済み評価
export const SavedRatingSchema = z.object({
	id: z.number(),
	articleId: z.number(),
	practicalValue: z.number(),
	technicalDepth: z.number(),
	understanding: z.number(),
	novelty: z.number(),
	importance: z.number(),
	totalScore: z.number(),
	comment: z.string().optional(),
	createdAt: z.string(),
});

export type SavedRating = z.infer<typeof SavedRatingSchema>;

// コマンド実行結果
export const CommandResultSchema = z.object({
	success: z.boolean(),
	data: z.any().optional(),
	error: z.string().optional(),
});

export type CommandResult = z.infer<typeof CommandResultSchema>;

// プログレスステップ
export interface ProgressStep {
	step: number;
	total: number;
	name: string;
	description: string;
}

// エラー情報
export interface ErrorInfo {
	url: string;
	error: string;
	timestamp: string;
}

// バッチ処理結果
export interface BatchResult {
	results: SavedRating[];
	errors: ErrorInfo[];
	summary: {
		total: number;
		success: number;
		failed: number;
		duration: number;
	};
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("RateArticleOptionsSchemaが正しく動作する", () => {
		const validOptions = {
			url: "https://example.com/article",
			autoEvaluate: true,
			outputFormat: "json" as const,
		};
		const result = RateArticleOptionsSchema.parse(validOptions);
		expect(result.url).toBe("https://example.com/article");
		expect(result.autoEvaluate).toBe(true);
		expect(result.outputFormat).toBe("json");
		expect(result.skipConfirmation).toBe(false); // デフォルト値
	});

	test("ArticleContentSchemaが正しく動作する", () => {
		const validContent = {
			title: "テスト記事",
			content: "記事の内容です。",
			wordCount: 100,
			url: "https://example.com/article",
		};
		const result = ArticleContentSchema.parse(validContent);
		expect(result.title).toBe("テスト記事");
		expect(result.wordCount).toBe(100);
	});

	test("RatingResultSchemaが評価範囲をチェックする", () => {
		const validRating = {
			practicalValue: 8,
			technicalDepth: 7,
			understanding: 9,
			novelty: 6,
			importance: 8,
			totalScore: 7.6,
		};
		const result = RatingResultSchema.parse(validRating);
		expect(result.totalScore).toBe(7.6);

		// 範囲外の値はエラーになる
		expect(() => {
			RatingResultSchema.parse({ ...validRating, practicalValue: 11 });
		}).toThrow();
	});
}
