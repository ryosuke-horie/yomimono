/**
 * 記事内容抽出機能
 * Web ページから記事内容を抽出する
 */
import type { ArticleContent } from "../types/index.js";
import { UrlUtils } from "./utils.js";

/**
 * コンテンツ抽出の設定
 */
export interface ExtractionOptions {
	timeout?: number;
	userAgent?: string;
	waitForSelector?: string;
	removeSelectors?: string[];
}

/**
 * 記事内容抽出クラス
 */
export class ContentExtractor {
	private options: ExtractionOptions;

	constructor(options: ExtractionOptions = {}) {
		this.options = {
			timeout: 30000,
			userAgent:
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			...options,
		};
	}

	/**
	 * URL から記事内容を抽出
	 */
	async extractContent(url: string): Promise<ArticleContent> {
		if (!UrlUtils.isValidUrl(url)) {
			throw new Error(`無効なURLです: ${url}`);
		}

		try {
			// 簡易版：fetch で HTML を取得して基本的な抽出を行う
			const response = await fetch(url, {
				headers: {
					"User-Agent": this.options.userAgent!,
				},
				signal: AbortSignal.timeout(this.options.timeout!),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const html = await response.text();
			return this.parseHtmlContent(html, url);
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === "TimeoutError") {
					throw new Error(`タイムアウトが発生しました（${this.options.timeout}ms）: ${url}`);
				}
				throw new Error(`記事内容の取得に失敗しました: ${error.message}`);
			}
			throw new Error(`記事内容の取得に失敗しました: ${error}`);
		}
	}

	/**
	 * HTML から記事内容を解析
	 */
	private parseHtmlContent(html: string, url: string): ArticleContent {
		// タイトルを抽出
		const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
		const title = titleMatch ? this.cleanText(titleMatch[1]) : UrlUtils.extractTitleFromUrl(url);

		// メタディスクリプションを抽出
		const descriptionMatch = html.match(
			/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i
		);
		const description = descriptionMatch ? this.cleanText(descriptionMatch[1]) : undefined;

		// 記事本文を抽出（簡易版）
		let content = this.extractMainContent(html);

		// HTMLタグを除去
		content = this.stripHtmlTags(content);

		// テキストをクリーンアップ
		content = this.cleanText(content);

		// 文字数をカウント
		const wordCount = this.countWords(content);

		// 要約を生成（先頭200文字）
		const summary = content.length > 200 ? `${content.substring(0, 200)}...` : content;

		return {
			title,
			content,
			wordCount,
			summary: description || summary,
			url,
		};
	}

	/**
	 * メインコンテンツを抽出
	 */
	private extractMainContent(html: string): string {
		// 一般的な記事コンテナのセレクターを試行
		const contentSelectors = [
			"article",
			'[role="main"]',
			".content",
			".post-content",
			".entry-content",
			".article-content",
			".main-content",
			"main",
			".container",
		];

		for (const selector of contentSelectors) {
			const regex = new RegExp(
				`<[^>]*class[^>]*${selector.replace(".", "")}[^>]*>(.*?)<\/[^>]*>`,
				"gis"
			);
			const match = html.match(regex);
			if (match?.[1]) {
				return match[1];
			}
		}

		// フォールバック：body 内のコンテンツを抽出
		const bodyMatch = html.match(/<body[^>]*>(.*?)<\/body>/is);
		return bodyMatch ? bodyMatch[1] : html;
	}

	/**
	 * HTML タグを除去
	 */
	private stripHtmlTags(html: string): string {
		return html
			.replace(/<script[^>]*>.*?<\/script>/gis, "") // スクリプトを除去
			.replace(/<style[^>]*>.*?<\/style>/gis, "") // スタイルを除去
			.replace(/<[^>]+>/g, " ") // その他のHTMLタグを除去
			.replace(/\s+/g, " "); // 連続する空白を単一のスペースに
	}

	/**
	 * テキストをクリーンアップ
	 */
	private cleanText(text: string): string {
		return text
			.replace(/&nbsp;/g, " ") // ノンブレーキングスペースを通常のスペースに
			.replace(/&lt;/g, "<") // HTMLエンティティをデコード
			.replace(/&gt;/g, ">")
			.replace(/&amp;/g, "&")
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/\s+/g, " ") // 連続する空白を単一のスペースに
			.trim();
	}

	/**
	 * 単語数をカウント
	 */
	private countWords(text: string): number {
		// 日本語と英語の混在を考慮した文字数カウント
		const japaneseChars = text.replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, "");
		const englishWords = text
			.replace(/[^\w\s]/g, "")
			.split(/\s+/)
			.filter(Boolean);

		return japaneseChars.length + englishWords.length;
	}
}

/**
 * MCP サーバー経由での記事内容抽出（高度版）
 */
export class McpContentExtractor extends ContentExtractor {
	/**
	 * Playwright MCP を使用して記事内容を抽出
	 */
	async extractContentWithMcp(url: string): Promise<ArticleContent> {
		// TODO: MCP サーバーとの連携実装
		// 現在は基本版で代替
		return await this.extractContent(url);
	}
}

/**
 * デフォルトコンテンツ抽出インスタンス
 */
export const contentExtractor = new ContentExtractor();
export const mcpContentExtractor = new McpContentExtractor();

if (import.meta.vitest) {
	const { test, expect, vi } = import.meta.vitest;

	// fetch のモック
	global.fetch = vi.fn();

	test("ContentExtractor が正しく初期化される", () => {
		const extractor = new ContentExtractor();
		expect(extractor).toBeInstanceOf(ContentExtractor);
	});

	test("extractContent が正しく動作する", async () => {
		const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>テスト記事のタイトル</title>
          <meta name="description" content="これはテスト記事の説明です。">
        </head>
        <body>
          <article>
            <h1>記事タイトル</h1>
            <p>これは記事の本文です。とても有益な内容が含まれています。</p>
            <p>複数の段落があります。</p>
          </article>
        </body>
      </html>
    `;

		(fetch as any).mockResolvedValueOnce({
			ok: true,
			text: () => Promise.resolve(mockHtml),
		});

		const extractor = new ContentExtractor();
		const result = await extractor.extractContent("https://example.com/article");

		expect(result.title).toBe("テスト記事のタイトル");
		expect(result.content).toContain("記事の本文");
		expect(result.url).toBe("https://example.com/article");
		expect(result.wordCount).toBeGreaterThan(0);
		expect(result.summary).toBe("これはテスト記事の説明です。");
	});

	test("extractContent が無効なURLでエラーを投げる", async () => {
		const extractor = new ContentExtractor();
		await expect(extractor.extractContent("invalid-url")).rejects.toThrow("無効なURLです");
	});

	test("extractContent がHTTPエラーを適切に処理する", async () => {
		(fetch as any).mockResolvedValueOnce({
			ok: false,
			status: 404,
			statusText: "Not Found",
		});

		const extractor = new ContentExtractor();
		await expect(extractor.extractContent("https://example.com/404")).rejects.toThrow(
			"HTTP 404: Not Found"
		);
	});

	test("extractContent がタイムアウトを適切に処理する", async () => {
		(fetch as any).mockRejectedValueOnce(
			Object.assign(new Error("Timeout"), { name: "TimeoutError" })
		);

		const extractor = new ContentExtractor({ timeout: 1000 });
		await expect(extractor.extractContent("https://example.com/slow")).rejects.toThrow(
			"タイムアウトが発生しました"
		);
	});

	test("stripHtmlTags が正しくHTMLタグを除去する", () => {
		const extractor = new ContentExtractor();
		const html = '<p>テスト<strong>太字</strong>テキスト</p><script>alert("test")</script>';
		const result = (extractor as any).stripHtmlTags(html);
		expect(result).toBe(" テスト 太字 テキスト ");
		expect(result).not.toContain("<script>");
	});

	test("countWords が日本語と英語の混在文章で正しく動作する", () => {
		const extractor = new ContentExtractor();
		const text = "これはtest文章です。Hello world.";
		const result = (extractor as any).countWords(text);
		expect(result).toBeGreaterThan(0);
	});
}
