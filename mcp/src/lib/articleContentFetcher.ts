/**
 * 記事内容取得とプロンプト生成機能
 * Playwright MCPとの連携を前提とした実装
 */

export interface ArticleContent {
	title: string;
	content: string;
	metadata: {
		author?: string;
		publishedDate?: string;
		tags?: string[];
		readingTime?: number;
	};
}

/**
 * 記事内容を取得する（Playwright MCP連携）
 * 現段階では基本的な実装を提供し、後でPlaywright MCPとの統合を行う
 */
export async function fetchArticleContent(
	url: string,
): Promise<ArticleContent> {
	// URL検証
	try {
		new URL(url);
	} catch {
		throw new Error("Invalid URL");
	}

	try {
		// 現在は基本的なfetchを使用、後でPlaywright MCPに置き換え
		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; EffectiveYomimono/1.0)",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const html = await response.text();

		// 基本的なHTML解析（後でPlaywright MCPの高度な解析に置き換え）
		const content = extractContentFromHTML(html);

		return content;
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to fetch article content: ${error.message}`);
		}
		throw new Error("Failed to fetch article content: Unknown error");
	}
}

/**
 * HTMLから記事内容を抽出する（簡易版）
 * 将来的にPlaywright MCPの構造化データ取得に置き換え
 */
function extractContentFromHTML(html: string): ArticleContent {
	// 非常に基本的な解析（実際のPlaywright MCP実装では高度な解析を行う）
	const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
	const title = titleMatch ? titleMatch[1].trim() : "記事タイトル不明";

	// 本文の簡易抽出（実際にはarticle, main, .contentセレクターなどを使用）
	const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
	let content = "記事内容の取得に失敗しました";

	if (bodyMatch) {
		// HTMLタグを除去して本文を抽出
		content = bodyMatch[1]
			.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
			.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
			.replace(/<[^>]+>/g, " ")
			.replace(/\s+/g, " ")
			.trim()
			.substring(0, 2000); // 内容を2000文字に制限
	}

	// メタデータの簡易抽出
	const authorMatch = html.match(
		/<meta[^>]*name="author"[^>]*content="([^"]+)"/i,
	);
	const dateMatch = html.match(
		/<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/i,
	);

	return {
		title,
		content,
		metadata: {
			author: authorMatch ? authorMatch[1] : undefined,
			publishedDate: dateMatch ? dateMatch[1] : undefined,
			tags: [],
			readingTime: Math.ceil(content.length / 200), // 大まかな読み時間推定
		},
	};
}

/**
 * 記事評価用のプロンプトを生成する
 */
export function generateRatingPrompt(
	articleContent: ArticleContent | null,
	url: string,
): string {
	const template = `記事の内容を5つの軸で評価してください。各軸は1-10点で採点し、理由も含めて説明してください。

## 記事情報
- タイトル: {title}
- URL: {url}
- 公開日: {publishedDate}
- 著者: {author}

## 記事内容
{content}

## 評価軸
1. **実用性** (1-10点): 業務や実装で実際に活用できる度合い
2. **技術深度** (1-10点): 技術的な内容の深さ・専門性
3. **理解度** (1-10点): あなたにとっての理解しやすさ
4. **新規性** (1-10点): あなたにとっての新しさ・発見度
5. **重要度** (1-10点): 現在の関心・優先度への適合

## 出力形式
各軸について以下の形式で回答してください:
- 実用性: X点 (理由: ...)
- 技術深度: X点 (理由: ...)
- 理解度: X点 (理由: ...)
- 新規性: X点 (理由: ...)
- 重要度: X点 (理由: ...)

## 総合コメント
この記事から学んだことや印象を200文字程度でまとめてください。

評価完了後は、rateArticle ツールを使用して結果をシステムに保存してください。`;

	// プレースホルダーを実際の値で置換
	if (!articleContent) {
		return template
			.replace("{title}", "記事内容の取得に失敗しました")
			.replace("{url}", url)
			.replace("{publishedDate}", "N/A")
			.replace("{author}", "N/A")
			.replace("{content}", "記事内容を直接確認して評価を行ってください。");
	}

	return template
		.replace("{title}", articleContent.title)
		.replace("{url}", url)
		.replace("{publishedDate}", articleContent.metadata.publishedDate || "N/A")
		.replace("{author}", articleContent.metadata.author || "N/A")
		.replace("{content}", articleContent.content);
}

if (import.meta.vitest) {
	const { test, expect, describe, vi } = import.meta.vitest;

	describe("fetchArticleContent", () => {
		test("有効なURLから記事内容を取得する", async () => {
			// fetchのモック
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				text: async () => `
					<html>
						<head><title>テスト記事</title></head>
						<body>
							<article>
								<h1>記事タイトル</h1>
								<p>これはテスト記事の内容です。</p>
							</article>
						</body>
					</html>
				`,
			});

			const result = await fetchArticleContent("https://example.com/article");

			expect(result.title).toBe("テスト記事");
			expect(result.content).toContain("記事タイトル");
			expect(result.metadata.readingTime).toBeGreaterThan(0);
		});

		test("無効なURLでエラーを投げる", async () => {
			await expect(fetchArticleContent("invalid-url")).rejects.toThrow(
				"Invalid URL",
			);
		});
	});

	describe("generateRatingPrompt", () => {
		test("記事内容から適切なプロンプトを生成する", () => {
			const articleContent: ArticleContent = {
				title: "TypeScript入門",
				content: "TypeScriptは...",
				metadata: {
					author: "田中太郎",
					publishedDate: "2024-01-01",
				},
			};

			const prompt = generateRatingPrompt(
				articleContent,
				"https://example.com",
			);

			expect(prompt).toContain("TypeScript入門");
			expect(prompt).toContain("田中太郎");
			expect(prompt).toContain("2024-01-01");
		});

		test("記事内容がnullの場合のプロンプト生成", () => {
			const prompt = generateRatingPrompt(null, "https://example.com");

			expect(prompt).toContain("記事内容の取得に失敗しました");
			expect(prompt).toContain("https://example.com");
		});
	});
}
