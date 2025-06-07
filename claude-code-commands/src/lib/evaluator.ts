/**
 * 記事評価機能
 * Claude を使用して記事を評価する
 */
import type { ArticleContent, RatingResult } from "../types/index.js";

/**
 * 評価設定
 */
export interface EvaluationConfig {
	model?: string;
	temperature?: number;
	maxTokens?: number;
	systemPrompt?: string;
}

/**
 * 記事評価クラス
 */
export class ArticleEvaluator {
	private config: EvaluationConfig;

	constructor(config: EvaluationConfig = {}) {
		this.config = {
			model: "claude-3-5-sonnet-20241022",
			temperature: 0.3,
			maxTokens: 2000,
			...config,
		};
	}

	/**
	 * 記事を評価する
	 */
	async evaluateArticle(content: ArticleContent): Promise<RatingResult> {
		const prompt = this.generateEvaluationPrompt(content);

		try {
			// Claude API を使用して評価を実行
			const response = await this.callClaudeApi(prompt);
			return this.parseEvaluationResponse(response);
		} catch (error) {
			throw new Error(`記事評価に失敗しました: ${error}`);
		}
	}

	/**
	 * 評価プロンプトを生成
	 */
	private generateEvaluationPrompt(content: ArticleContent): string {
		return `以下の技術記事を5つの観点から1-10点で評価してください。

# 記事情報
- タイトル: ${content.title}
- URL: ${content.url}
- 文字数: ${content.wordCount}

# 記事内容
${content.content.substring(0, 3000)}${content.content.length > 3000 ? "..." : ""}

# 評価観点
1. **実用性 (practicalValue)**: 実際の開発現場で役立つか
2. **技術深度 (technicalDepth)**: 技術的な深い理解を示しているか
3. **理解度 (understanding)**: 内容が分かりやすく説明されているか
4. **新規性 (novelty)**: 新しい知見や斬新なアプローチがあるか
5. **重要度 (importance)**: 技術者として知っておくべき重要な内容か

# 出力形式
以下のJSON形式で回答してください：

\`\`\`json
{
  "practicalValue": 8,
  "technicalDepth": 7,
  "understanding": 9,
  "novelty": 6,
  "importance": 8,
  "totalScore": 7.6,
  "comment": "評価理由と要約（200文字以内）"
}
\`\`\`

# 評価基準
- 各項目は1-10の整数で評価
- totalScoreは5項目の平均（小数点第1位まで）
- commentは具体的で建設的な内容にする
- 技術記事として客観的に評価する`;
	}

	/**
	 * Claude API を呼び出し
	 */
	private async callClaudeApi(prompt: string): Promise<string> {
		// 環境変数から API キーを取得
		const apiKey = process.env.ANTHROPIC_API_KEY;
		if (!apiKey) {
			throw new Error("ANTHROPIC_API_KEY 環境変数が設定されていません");
		}

		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify({
				model: this.config.model,
				max_tokens: this.config.maxTokens,
				temperature: this.config.temperature,
				system: this.config.systemPrompt || "技術記事の評価を専門とするAIアシスタントです。",
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				`Claude API エラー: ${response.status} ${errorData.error?.message || response.statusText}`
			);
		}

		const data = await response.json();
		return data.content[0].text;
	}

	/**
	 * 評価レスポンスを解析
	 */
	private parseEvaluationResponse(response: string): RatingResult {
		try {
			// JSON ブロックを抽出
			const jsonMatch = response.match(/```json\s*(.*?)\s*```/s);
			if (!jsonMatch) {
				throw new Error("評価結果のJSON形式が見つかりません");
			}

			const result = JSON.parse(jsonMatch[1]);

			// 必須フィールドの検証
			const requiredFields = [
				"practicalValue",
				"technicalDepth",
				"understanding",
				"novelty",
				"importance",
				"totalScore",
			];

			for (const field of requiredFields) {
				if (typeof result[field] !== "number") {
					throw new Error(`評価結果に${field}が含まれていません`);
				}
			}

			// 値の範囲チェック
			const scoreFields = requiredFields.slice(0, 5); // totalScore 以外
			for (const field of scoreFields) {
				if (result[field] < 1 || result[field] > 10) {
					throw new Error(`${field}の値が範囲外です（1-10）: ${result[field]}`);
				}
			}

			// totalScore の計算チェック
			const expectedTotal =
				(result.practicalValue +
					result.technicalDepth +
					result.understanding +
					result.novelty +
					result.importance) /
				5;
			const calculatedTotal = Math.round(expectedTotal * 10) / 10;

			return {
				practicalValue: result.practicalValue,
				technicalDepth: result.technicalDepth,
				understanding: result.understanding,
				novelty: result.novelty,
				importance: result.importance,
				totalScore: calculatedTotal, // 再計算した値を使用
				comment: result.comment || undefined,
			};
		} catch (error) {
			throw new Error(`評価結果の解析に失敗しました: ${error}`);
		}
	}

	/**
	 * バッチ評価用のプロンプト生成
	 */
	generateBatchPrompt(articles: ArticleContent[]): string {
		const articleSummaries = articles.map((article, index) => {
			return `## 記事 ${index + 1}
- タイトル: ${article.title}
- URL: ${article.url}
- 概要: ${article.summary || article.content.substring(0, 200)}...`;
		});

		return `以下の${articles.length}件の技術記事を一括で評価してください。

${articleSummaries.join("\n\n")}

各記事を実用性、技術深度、理解度、新規性、重要度の5観点から1-10点で評価し、
JSON配列形式で回答してください。`;
	}
}

/**
 * MCP サーバー経由での評価（高度版）
 */
export class McpArticleEvaluator extends ArticleEvaluator {
	/**
	 * MCP サーバーを使用して評価を実行
	 */
	async evaluateWithMcp(content: ArticleContent): Promise<RatingResult> {
		// TODO: MCP サーバーとの連携実装
		// 現在は基本版で代替
		return await this.evaluateArticle(content);
	}
}

/**
 * デフォルト評価インスタンス
 */
export const articleEvaluator = new ArticleEvaluator();
export const mcpArticleEvaluator = new McpArticleEvaluator();

if (import.meta.vitest) {
	const { test, expect, vi } = import.meta.vitest;

	// fetch のモック
	global.fetch = vi.fn();

	test("ArticleEvaluator が正しく初期化される", () => {
		const evaluator = new ArticleEvaluator();
		expect(evaluator).toBeInstanceOf(ArticleEvaluator);
	});

	test("generateEvaluationPrompt が正しくプロンプトを生成する", () => {
		const evaluator = new ArticleEvaluator();
		const content = {
			title: "テスト記事",
			content: "これはテストの記事内容です。",
			wordCount: 100,
			url: "https://example.com/article",
		};

		const prompt = (evaluator as any).generateEvaluationPrompt(content);
		expect(prompt).toContain("テスト記事");
		expect(prompt).toContain("実用性");
		expect(prompt).toContain("技術深度");
		expect(prompt).toContain("JSON形式");
	});

	test("parseEvaluationResponse が正しく評価結果を解析する", () => {
		const evaluator = new ArticleEvaluator();
		const mockResponse = `
以下が評価結果です：

\`\`\`json
{
  "practicalValue": 8,
  "technicalDepth": 7,
  "understanding": 9,
  "novelty": 6,
  "importance": 8,
  "totalScore": 7.6,
  "comment": "とても実用的な記事でした"
}
\`\`\`

以上です。
    `;

		const result = (evaluator as any).parseEvaluationResponse(mockResponse);
		expect(result.practicalValue).toBe(8);
		expect(result.technicalDepth).toBe(7);
		expect(result.understanding).toBe(9);
		expect(result.novelty).toBe(6);
		expect(result.importance).toBe(8);
		expect(result.totalScore).toBe(7.6);
		expect(result.comment).toBe("とても実用的な記事でした");
	});

	test("parseEvaluationResponse がJSONブロックがない場合にエラーを投げる", () => {
		const evaluator = new ArticleEvaluator();
		const invalidResponse = "これは有効なJSON形式ではありません";

		expect(() => {
			(evaluator as any).parseEvaluationResponse(invalidResponse);
		}).toThrow("評価結果のJSON形式が見つかりません");
	});

	test("parseEvaluationResponse が範囲外の値でエラーを投げる", () => {
		const evaluator = new ArticleEvaluator();
		const invalidResponse = `
\`\`\`json
{
  "practicalValue": 15,
  "technicalDepth": 7,
  "understanding": 9,
  "novelty": 6,
  "importance": 8,
  "totalScore": 7.6
}
\`\`\`
    `;

		expect(() => {
			(evaluator as any).parseEvaluationResponse(invalidResponse);
		}).toThrow("practicalValueの値が範囲外です");
	});

	test("evaluateArticle がAPIキーなしでエラーを投げる", async () => {
		// 環境変数をクリア
		process.env.ANTHROPIC_API_KEY = undefined;

		const evaluator = new ArticleEvaluator();
		const content = {
			title: "テスト記事",
			content: "内容",
			wordCount: 10,
			url: "https://example.com",
		};

		await expect(evaluator.evaluateArticle(content)).rejects.toThrow(
			"ANTHROPIC_API_KEY 環境変数が設定されていません"
		);
	});

	test("generateBatchPrompt が複数記事のプロンプトを生成する", () => {
		const evaluator = new ArticleEvaluator();
		const articles = [
			{
				title: "記事1",
				content: "内容1",
				wordCount: 100,
				url: "https://example.com/1",
			},
			{
				title: "記事2",
				content: "内容2",
				wordCount: 200,
				url: "https://example.com/2",
			},
		];

		const prompt = evaluator.generateBatchPrompt(articles);
		expect(prompt).toContain("記事1");
		expect(prompt).toContain("記事2");
		expect(prompt).toContain("2件の技術記事");
	});
}
