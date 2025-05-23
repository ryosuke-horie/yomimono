import { describe, expect, it } from "vitest";
import {
	PROMPT_TEMPLATE_VERSION,
	generateEngineerSummaryPrompt,
	generateSimpleSummaryPrompt,
	getSummaryPrompt,
} from "../lib/promptTemplates.js";

describe("promptTemplates", () => {
	const mockOptions = {
		url: "https://example.com/react-18-features",
		title: "React 18の新機能と並行レンダリング",
		bookmarkId: 123,
		maxLength: 500,
		includeKeyPoints: true,
	};

	describe("generateEngineerSummaryPrompt", () => {
		it("エンジニア向け詳細プロンプトが正しく生成される", () => {
			const prompt = generateEngineerSummaryPrompt(mockOptions);

			// 基本情報が含まれていることを確認
			expect(prompt).toContain(mockOptions.url);
			expect(prompt).toContain(mockOptions.title);
			expect(prompt).toContain(`ブックマークID: ${mockOptions.bookmarkId}`);
			expect(prompt).toContain(`${mockOptions.maxLength}文字以内`);

			// エンジニア向けの詳細な要素が含まれていることを確認
			expect(prompt).toContain("【概要】");
			expect(prompt).toContain("【学習ポイント】");
			expect(prompt).toContain("【実装に役立つ情報】");
			expect(prompt).toContain("【関連技術・エコシステム】");

			// 品質基準が含まれていることを確認
			expect(prompt).toContain("品質基準");
			expect(prompt).toContain("具体性");
			expect(prompt).toContain("実用性");
			expect(prompt).toContain("正確性");

			// 作業手順が含まれていることを確認
			expect(prompt).toContain("作業手順");
			expect(prompt).toContain("saveSummary ツール");
		});

		it("文字数の目安が正しく計算される", () => {
			const prompt = generateEngineerSummaryPrompt(mockOptions);
			const expectedMin = Math.floor(mockOptions.maxLength * 0.8);
			const expectedMax = mockOptions.maxLength;

			expect(prompt).toContain(`${expectedMin}-${expectedMax}文字`);
		});

		it("技術記事特有の解析ポイントが含まれている", () => {
			const prompt = generateEngineerSummaryPrompt(mockOptions);

			expect(prompt).toContain("コードブロック");
			expect(prompt).toContain("技術用語");
			expect(prompt).toContain("実装手順");
			expect(prompt).toContain("性能・効果");
			expect(prompt).toContain("制約・注意点");
		});
	});

	describe("generateSimpleSummaryPrompt", () => {
		it("シンプルプロンプトが正しく生成される", () => {
			const simpleOptions = { ...mockOptions, includeKeyPoints: false };
			const prompt = generateSimpleSummaryPrompt(simpleOptions);

			// 基本情報が含まれていることを確認
			expect(prompt).toContain(mockOptions.url);
			expect(prompt).toContain(mockOptions.title);
			expect(prompt).toContain(`ブックマークID: ${mockOptions.bookmarkId}`);
			expect(prompt).toContain(`${mockOptions.maxLength}文字以内`);

			// シンプルなフォーマットであることを確認
			expect(prompt).toContain("【技術要約】");
			expect(prompt).not.toContain("【学習ポイント】");
			expect(prompt).not.toContain("【実装に役立つ情報】");

			// 簡潔性を重視していることを確認
			expect(prompt.length).toBeLessThan(
				generateEngineerSummaryPrompt(mockOptions).length,
			);
		});
	});

	describe("getSummaryPrompt", () => {
		it("includeKeyPointsがtrueの場合、詳細プロンプトを返す", () => {
			const optionsWithKeyPoints = { ...mockOptions, includeKeyPoints: true };
			const prompt = getSummaryPrompt(optionsWithKeyPoints);

			expect(prompt).toContain("【学習ポイント】");
			expect(prompt).toContain("【実装に役立つ情報】");
			expect(prompt).toContain("品質基準");
		});

		it("includeKeyPointsがfalseの場合、シンプルプロンプトを返す", () => {
			const optionsWithoutKeyPoints = {
				...mockOptions,
				includeKeyPoints: false,
			};
			const prompt = getSummaryPrompt(optionsWithoutKeyPoints);

			expect(prompt).toContain("【技術要約】");
			expect(prompt).not.toContain("【学習ポイント】");
			expect(prompt).not.toContain("品質基準");
		});
	});

	describe("プロンプトの共通要素", () => {
		it("両方のプロンプトにsaveSummaryツールの指示が含まれている", () => {
			const detailedPrompt = generateEngineerSummaryPrompt(mockOptions);
			const simplePrompt = generateSimpleSummaryPrompt(mockOptions);

			expect(detailedPrompt).toContain("saveSummary");
			expect(simplePrompt).toContain("saveSummary");
		});

		it("両方のプロンプトに技術的な正確性の要求が含まれている", () => {
			const detailedPrompt = generateEngineerSummaryPrompt(mockOptions);
			const simplePrompt = generateSimpleSummaryPrompt(mockOptions);

			expect(detailedPrompt).toContain("技術的な正確性");
			expect(simplePrompt).toContain("技術的な正確性");
		});

		it("両方のプロンプトにエンジニア向けの指示が含まれている", () => {
			const detailedPrompt = generateEngineerSummaryPrompt(mockOptions);
			const simplePrompt = generateSimpleSummaryPrompt(mockOptions);

			expect(detailedPrompt).toContain("エンジニア向け");
			expect(simplePrompt).toContain("エンジニア向け");
		});
	});

	describe("エッジケース", () => {
		it("タイトルがnullの場合でも正しく処理される", () => {
			const optionsWithoutTitle = {
				...mockOptions,
				title: "",
			};
			const prompt = getSummaryPrompt(optionsWithoutTitle);

			expect(prompt).toContain("タイトルなし");
		});

		it("異なる文字数制限でも正しく処理される", () => {
			const shortOptions = { ...mockOptions, maxLength: 200 };
			const longOptions = { ...mockOptions, maxLength: 1000 };

			const shortPrompt = getSummaryPrompt(shortOptions);
			const longPrompt = getSummaryPrompt(longOptions);

			expect(shortPrompt).toContain("200文字以内");
			expect(longPrompt).toContain("1000文字以内");
		});
	});

	describe("メタデータ", () => {
		it("プロンプトテンプレートのバージョンが定義されている", () => {
			expect(PROMPT_TEMPLATE_VERSION).toBeDefined();
			expect(typeof PROMPT_TEMPLATE_VERSION).toBe("string");
			expect(PROMPT_TEMPLATE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
		});
	});

	describe("プロンプトの実用性テスト", () => {
		it("実際の技術記事URLで適切なプロンプトが生成される", () => {
			const realWorldOptions = {
				url: "https://qiita.com/example/react-18-concurrent-features",
				title:
					"React 18の並行機能を理解する：Suspense、Transitions、そして新しいレンダリング",
				bookmarkId: 456,
				maxLength: 800,
				includeKeyPoints: true,
			};

			const prompt = getSummaryPrompt(realWorldOptions);

			// 長いタイトルでも適切に処理されることを確認
			expect(prompt).toContain(realWorldOptions.title);
			expect(prompt).toContain("800文字以内");

			// プロンプト全体が適切な長さであることを確認（あまりに長すぎないこと）
			expect(prompt.length).toBeLessThan(5000);
			expect(prompt.length).toBeGreaterThan(1000);
		});
	});
});
