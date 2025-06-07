/**
 * 記事内容取得とプロンプト生成機能
 * Playwright MCPとの連携による高度な記事抽出システム
 */

// Playwright型定義（オプショナル）
type Browser = any;
type Page = any;

export interface ArticleContent {
	title: string;
	content: string;
	metadata: {
		author?: string;
		publishedDate?: string;
		tags?: string[];
		readingTime?: number;
		description?: string;
		language?: string;
		wordCount?: number;
	};
	extractionMethod: string;
	qualityScore: number;
}

export interface SiteStrategy {
	selectors: string[];
	metadata: {
		author?: string[];
		publishedDate?: string[];
		tags?: string[];
		title?: string[];
		description?: string[];
	};
	fallbackSelectors?: string[];
	excludeSelectors?: string[];
}

export interface ExtractionStrategy {
	name: string;
	priority: number;
	extract: (page: Page, url: string) => Promise<ArticleContent | null>;
	validate: (content: ArticleContent) => boolean;
}

// サイト別最適化設定
const SITE_STRATEGIES: Record<string, SiteStrategy> = {
	"zenn.dev": {
		selectors: [".znc", ".zenn-content"],
		metadata: {
			author: [".ArticleHeader_author a", ".znc_author a"],
			publishedDate: ["[datetime]", "time[datetime]"],
			tags: [".ArticleHeader_tag", ".znc_tag"],
			title: ["h1.ArticleHeader_title", "h1"],
			description: ['meta[name="description"]'],
		},
		excludeSelectors: [".znc_sidebar", ".znc_ad"],
	},
	"qiita.com": {
		selectors: [".it-MdContent", ".p-items_article"],
		metadata: {
			author: [".p-items_authorName", ".UserInfo_name"],
			publishedDate: [".p-items_createdAt", "time"],
			tags: [".p-items_tag", ".TagList_tag"],
			title: ["h1.p-items_title", "h1"],
		},
	},
	"note.com": {
		selectors: [".note-common-styles__textnote-body", ".o-noteContentBody"],
		metadata: {
			author: [".o-noteContentHeader__authorName", ".p-userInfo__name"],
			publishedDate: [".o-noteContentHeader__date", "time"],
			title: ["h1.o-noteContentHeader__title", "h1"],
		},
	},
	"medium.com": {
		selectors: ["article section", ".postArticle-content"],
		metadata: {
			author: ['[data-testid="authorName"]', ".ds-link--styleSubtle"],
			publishedDate: ["time", '[data-testid="storyPublishDate"]'],
			tags: ["[data-testid='storyTags'] a", ".tag"],
		},
	},
	default: {
		selectors: [
			"article",
			'[role="main"] article',
			"main article",
			".article-content",
			".post-content",
			".entry-content",
			".content",
			"main",
		],
		metadata: {
			author: ['meta[name="author"]', ".author", ".byline"],
			publishedDate: [
				'meta[property="article:published_time"]',
				"time[datetime]",
				".date",
			],
			title: ["h1", "title"],
			description: [
				'meta[name="description"]',
				'meta[property="og:description"]',
			],
		},
		fallbackSelectors: ["body"],
	},
};

/**
 * Playwrightを使用した高度な記事内容取得
 */
export async function fetchArticleContent(
	url: string,
	browser?: Browser,
): Promise<ArticleContent> {
	// URL検証
	try {
		new URL(url);
	} catch {
		throw new Error("Invalid URL");
	}

	// ブラウザが提供されていない場合はフォールバック
	if (!browser) {
		return await fallbackFetchContent(url);
	}

	try {
		const page = await browser.newPage();

		// ページの設定
		await page.setExtraHTTPHeaders({
			"User-Agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
		});
		await page.setViewportSize({ width: 1280, height: 800 });

		// ページ読み込み
		await page.goto(url, {
			waitUntil: "domcontentloaded",
			timeout: 30000,
		});

		// 不要な要素を削除
		await page.evaluate(() => {
			const elementsToRemove = [
				"script",
				"style",
				"noscript",
				".ad",
				".advertisement",
				"[class*='ad']",
				"[id*='ad']",
				"navigation",
				"header",
				"footer",
				"aside",
			];

			for (const selector of elementsToRemove) {
				const elements = document.querySelectorAll(selector);
				for (const element of Array.from(elements)) {
					element.remove();
				}
			}
		});

		// 複数の抽出戦略を試行
		const strategies = getExtractionStrategies();

		for (const strategy of strategies) {
			try {
				const content = await strategy.extract(page, url);
				if (content && strategy.validate(content)) {
					await page.close();
					return content;
				}
			} catch (error) {
				console.warn(`Strategy ${strategy.name} failed:`, error);
			}
		}

		await page.close();
		throw new Error("All extraction strategies failed");
	} catch (error) {
		if (error instanceof Error) {
			throw new Error(`Failed to fetch article content: ${error.message}`);
		}
		throw new Error("Failed to fetch article content: Unknown error");
	}
}

/**
 * 抽出戦略の定義
 */
function getExtractionStrategies(): ExtractionStrategy[] {
	return [
		{
			name: "structured-data",
			priority: 1,
			extract: extractStructuredData,
			validate: (content) => content.qualityScore >= 0.8,
		},
		{
			name: "semantic-elements",
			priority: 2,
			extract: extractSemanticElements,
			validate: (content) => content.qualityScore >= 0.6,
		},
		{
			name: "site-specific",
			priority: 3,
			extract: extractWithSiteStrategy,
			validate: (content) => content.qualityScore >= 0.7,
		},
		{
			name: "generic-selectors",
			priority: 4,
			extract: extractWithGenericSelectors,
			validate: (content) => content.qualityScore >= 0.4,
		},
	];
}

/**
 * 構造化データからの抽出
 */
async function extractStructuredData(
	page: Page,
	url: string,
): Promise<ArticleContent | null> {
	try {
		// JSON-LDの取得
		const jsonLdData = await page.evaluate(() => {
			const scripts = document.querySelectorAll(
				'script[type="application/ld+json"]',
			);
			return Array.from(scripts)
				.map((script) => {
					try {
						return JSON.parse(script.textContent || "");
					} catch {
						return null;
					}
				})
				.filter(Boolean);
		});

		// Open Graph / Twitter Cardの取得
		const metadata = await page.evaluate(() => {
			const getMeta = (selector: string) =>
				document.querySelector(selector)?.getAttribute("content") || null;

			return {
				title:
					getMeta('meta[property="og:title"]') ||
					getMeta('meta[name="twitter:title"]') ||
					document.title,
				description:
					getMeta('meta[property="og:description"]') ||
					getMeta('meta[name="description"]'),
				author: getMeta('meta[name="author"]'),
				publishedTime: getMeta('meta[property="article:published_time"]'),
				language:
					document.documentElement.lang ||
					getMeta('meta[http-equiv="content-language"]'),
			};
		});

		// JSON-LDからArticle情報を抽出
		let articleData = null;
		for (const data of jsonLdData) {
			if (data["@type"] === "Article" || data["@type"] === "BlogPosting") {
				articleData = data;
				break;
			}
		}

		if (!articleData && !metadata.title) {
			return null;
		}

		// 記事本文の取得
		const content = await extractMainContent(page);
		if (!content || content.length < 100) {
			return null;
		}

		const wordCount = content.split(/\s+/).length;
		const readingTime = Math.ceil(wordCount / 200);

		return {
			title: articleData?.headline || metadata.title || "タイトル不明",
			content,
			metadata: {
				author:
					articleData?.author?.name ||
					articleData?.author ||
					metadata.author ||
					undefined,
				publishedDate:
					articleData?.datePublished || metadata.publishedTime || undefined,
				tags: articleData?.keywords || [],
				readingTime,
				description:
					articleData?.description || metadata.description || undefined,
				language: metadata.language || undefined,
				wordCount,
			},
			extractionMethod: "structured-data",
			qualityScore: calculateQualityScore({
				hasStructuredData: true,
				contentLength: content.length,
				hasMetadata: !!(metadata.author || metadata.publishedTime),
				hasDescription: !!metadata.description,
			}),
		};
	} catch (error) {
		console.warn("Structured data extraction failed:", error);
		return null;
	}
}

/**
 * セマンティック要素からの抽出
 */
async function extractSemanticElements(
	page: Page,
	url: string,
): Promise<ArticleContent | null> {
	const selectors = [
		"article",
		'[role="main"] article',
		"main article",
		"main",
		".article",
		".content",
	];

	for (const selector of selectors) {
		try {
			const element = await page.$(selector);
			if (!element) continue;

			const content = await extractElementContent(page, element);
			if (!content || content.length < 100) continue;

			const title = await extractTitle(page);
			const metadata = await extractBasicMetadata(page);
			const wordCount = content.split(/\s+/).length;

			return {
				title,
				content,
				metadata: {
					...metadata,
					readingTime: Math.ceil(wordCount / 200),
					wordCount,
				},
				extractionMethod: "semantic-elements",
				qualityScore: calculateQualityScore({
					hasStructuredData: false,
					contentLength: content.length,
					hasMetadata: !!(metadata.author || metadata.publishedDate),
					hasDescription: !!metadata.description,
				}),
			};
		} catch (error) {
			console.warn(
				`Semantic extraction failed for selector ${selector}:`,
				error,
			);
		}
	}

	return null;
}

/**
 * サイト固有戦略での抽出
 */
async function extractWithSiteStrategy(
	page: Page,
	url: string,
): Promise<ArticleContent | null> {
	const hostname = new URL(url).hostname;
	const strategy = SITE_STRATEGIES[hostname] || SITE_STRATEGIES.default;

	for (const selector of strategy.selectors) {
		try {
			const element = await page.$(selector);
			if (!element) continue;

			const content = await extractElementContent(page, element);
			if (!content || content.length < 100) continue;

			const title = await extractMetadataBySelectors(
				page,
				strategy.metadata.title || ["h1", "title"],
			);
			const author = await extractMetadataBySelectors(
				page,
				strategy.metadata.author || [],
			);
			const publishedDate = await extractMetadataBySelectors(
				page,
				strategy.metadata.publishedDate || [],
			);
			const description = await extractMetadataBySelectors(
				page,
				strategy.metadata.description || [],
			);

			const wordCount = content.split(/\s+/).length;

			return {
				title: title || "タイトル不明",
				content,
				metadata: {
					author: author || undefined,
					publishedDate: publishedDate || undefined,
					description: description || undefined,
					readingTime: Math.ceil(wordCount / 200),
					wordCount,
				},
				extractionMethod: "site-specific",
				qualityScore: calculateQualityScore({
					hasStructuredData: false,
					contentLength: content.length,
					hasMetadata: !!(author || publishedDate),
					hasDescription: !!description,
				}),
			};
		} catch (error) {
			console.warn(
				`Site strategy extraction failed for selector ${selector}:`,
				error,
			);
		}
	}

	return null;
}

/**
 * 汎用セレクターでの抽出
 */
async function extractWithGenericSelectors(
	page: Page,
	url: string,
): Promise<ArticleContent | null> {
	const selectors = ["body"];

	for (const selector of selectors) {
		try {
			const content = await extractMainContent(page);
			if (!content || content.length < 100) continue;

			const title = await extractTitle(page);
			const metadata = await extractBasicMetadata(page);
			const wordCount = content.split(/\s+/).length;

			return {
				title,
				content,
				metadata: {
					...metadata,
					readingTime: Math.ceil(wordCount / 200),
					wordCount,
				},
				extractionMethod: "generic-selectors",
				qualityScore: calculateQualityScore({
					hasStructuredData: false,
					contentLength: content.length,
					hasMetadata: !!(metadata.author || metadata.publishedDate),
					hasDescription: !!metadata.description,
				}),
			};
		} catch (error) {
			console.warn("Generic extraction failed:", error);
		}
	}

	return null;
}

/**
 * フォールバック用の基本的な取得方法
 */
async function fallbackFetchContent(url: string): Promise<ArticleContent> {
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
		return extractContentFromHTML(html);
	} catch (error) {
		throw new Error(
			`Fallback fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * HTMLから記事内容を抽出する（フォールバック用）
 */
function extractContentFromHTML(html: string): ArticleContent {
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

/**
 * ヘルパー関数群
 */
async function extractMainContent(page: Page): Promise<string> {
	return await page.evaluate(() => {
		const contentSelectors = [
			"article",
			"main",
			".content",
			".post",
			".article",
			"#content",
			".entry-content",
		];

		for (const selector of contentSelectors) {
			const element = document.querySelector(selector);
			if (element) {
				return element.textContent?.trim() || "";
			}
		}

		return document.body.textContent?.trim() || "";
	});
}

async function extractElementContent(
	page: Page,
	element: any,
): Promise<string> {
	return await page.evaluate(
		(el: any) => el.textContent?.trim() || "",
		element,
	);
}

async function extractTitle(page: Page): Promise<string> {
	return await page.evaluate(() => {
		const h1 = document.querySelector("h1");
		if (h1) return h1.textContent?.trim() || "";
		return document.title;
	});
}

async function extractBasicMetadata(page: Page) {
	return await page.evaluate(() => {
		const getMeta = (selector: string) =>
			document.querySelector(selector)?.getAttribute("content") || null;

		return {
			author: getMeta('meta[name="author"]') || undefined,
			publishedDate:
				getMeta('meta[property="article:published_time"]') || undefined,
			description: getMeta('meta[name="description"]') || undefined,
			language: document.documentElement.lang || undefined,
		};
	});
}

async function extractMetadataBySelectors(
	page: Page,
	selectors: string[],
): Promise<string | null> {
	for (const selector of selectors) {
		try {
			const result = await page.evaluate((sel: string) => {
				const element = document.querySelector(sel);
				if (!element) return null;

				if (element.tagName === "META") {
					return element.getAttribute("content");
				}
				return element.textContent?.trim() || null;
			}, selector);

			if (result) return result;
		} catch (error) {
			console.warn(
				`Failed to extract metadata with selector ${selector}:`,
				error,
			);
		}
	}
	return null;
}

function calculateQualityScore(factors: {
	hasStructuredData: boolean;
	contentLength: number;
	hasMetadata: boolean;
	hasDescription: boolean;
}): number {
	let score = 0;

	if (factors.hasStructuredData) score += 0.3;
	if (factors.contentLength > 500) score += 0.3;
	else if (factors.contentLength > 200) score += 0.2;
	else if (factors.contentLength > 100) score += 0.1;

	if (factors.hasMetadata) score += 0.2;
	if (factors.hasDescription) score += 0.2;

	return Math.min(score, 1.0);
}

/**
 * 評価軸別の詳細プロンプトテンプレート
 */
const EVALUATION_PROMPTS = {
	practicalValue: `
実用性評価 (1-10点):
この記事の内容が実際の業務や開発において、どの程度活用できるかを評価してください。

評価基準:
- 9-10点: 即座に適用可能、具体的な実装例あり
- 7-8点: 少し工夫すれば適用可能、参考になる
- 5-6点: 理論的には参考になるが、適用に工夫が必要
- 3-4点: 教養として有用だが、直接的な適用は困難
- 1-2点: 実用性に乏しい、理論的な内容のみ

考慮ポイント:
- 具体例やコードサンプルの有無
- 実装手順の明確さ
- 現実的な使用場面の想定
`,

	technicalDepth: `
技術深度評価 (1-10点):
この記事の技術的な内容の深さと専門性を評価してください。

評価基準:
- 9-10点: 高度な専門知識、詳細な技術解説
- 7-8点: 中級者向け、適度な技術詳細
- 5-6点: 基本的な技術内容、概要レベル
- 3-4点: 入門レベル、表面的な説明
- 1-2点: 技術的内容が薄い、一般論のみ

考慮ポイント:
- 技術的詳細の豊富さ
- 専門用語の適切な使用
- 背景理論の説明
- 実装の複雑さ
`,

	understanding: `
理解度評価 (1-10点):
あなたにとってこの記事がどの程度理解しやすいかを評価してください。

評価基準:
- 9-10点: 非常に分かりやすい、スムーズに理解
- 7-8点: 理解しやすい、多少の推測が必要
- 5-6点: 普通の理解しやすさ、部分的に難しい
- 3-4点: やや理解困難、専門知識が必要
- 1-2点: 理解困難、背景知識不足

考慮ポイント:
- 説明の論理的構成
- 例の分かりやすさ
- 前提知識の要求レベル
- 文章の読みやすさ
`,

	novelty: `
新規性評価 (1-10点):
あなたにとってこの記事の内容がどの程度新しい発見や学びをもたらすかを評価してください。

評価基準:
- 9-10点: 全く知らない内容、大きな発見
- 7-8点: 新しい観点や詳細、有益な学び
- 5-6点: 部分的に新しい内容、復習も含む
- 3-4点: 既知の内容が多い、わずかな学び
- 1-2点: ほぼ既知の内容、新しい学びなし

考慮ポイント:
- 既存知識との差分
- 新しい技術・手法の紹介
- 独自の視点や考察
- 最新情報の含有
`,

	importance: `
重要度評価 (1-10点):
現在のあなたの関心や優先度に対して、この記事がどの程度重要かを評価してください。

評価基準:
- 9-10点: 非常に重要、優先的に活用したい
- 7-8点: 重要、近いうちに参考にしたい
- 5-6点: 中程度の重要性、機会があれば活用
- 3-4点: やや関心あり、余裕があれば参考
- 1-2点: 現在の関心対象外

考慮ポイント:
- 現在の業務・プロジェクトとの関連
- 短期・中期の学習目標との適合
- キャリア発展への寄与
- 個人的興味・関心との一致
`,
};

/**
 * 記事評価用の高度なプロンプトを生成する
 */
export function generateRatingPrompt(
	articleContent: ArticleContent | null,
	url: string,
): string {
	if (!articleContent) {
		return generateFallbackPrompt(url);
	}

	const contentPreview =
		articleContent.content.length > 2000
			? `${articleContent.content.substring(0, 2000)}...`
			: articleContent.content;

	return `# 記事評価タスク

## 記事情報
- **タイトル**: ${articleContent.title}
- **URL**: ${url}
- **公開日**: ${articleContent.metadata.publishedDate || "N/A"}
- **著者**: ${articleContent.metadata.author || "N/A"}
- **推定読書時間**: ${articleContent.metadata.readingTime || "N/A"}分
- **文字数**: 約${articleContent.metadata.wordCount || "N/A"}文字
- **抽出方法**: ${articleContent.extractionMethod}
- **内容品質スコア**: ${(articleContent.qualityScore * 100).toFixed(0)}%
${articleContent.metadata.description ? `- **概要**: ${articleContent.metadata.description}` : ""}

## 記事内容
${contentPreview}

## 評価指示

以下の5つの軸で記事を評価してください。各軸について、詳細な評価基準を参考に1-10点で採点し、その理由を具体的に説明してください。

${Object.entries(EVALUATION_PROMPTS)
	.map(([key, prompt]) => `### ${key}\n${prompt}`)
	.join("\n\n")}

## 出力形式
以下のJSON形式で回答してください:

\`\`\`json
{
  "practicalValue": {
    "score": 8,
    "reason": "具体的なコード例があり、実際のプロジェクトで活用できる内容"
  },
  "technicalDepth": {
    "score": 7,
    "reason": "中級者向けの適度な技術詳細が含まれている"
  },
  "understanding": {
    "score": 9,
    "reason": "図解が豊富で、論理的な構成により理解しやすい"
  },
  "novelty": {
    "score": 6,
    "reason": "一部は既知だが、新しい実装パターンの紹介があった"
  },
  "importance": {
    "score": 8,
    "reason": "現在のプロジェクトで使用している技術スタックに直接関連"
  },
  "comment": "この記事から学んだことや印象を200文字程度でまとめてください"
}
\`\`\`

## 重要な注意事項
- 各軸は独立して評価してください
- 個人的な経験と知識レベルを考慮してください
- 評価理由は具体的で建設的な内容にしてください
- 総合的な価値判断ではなく、各軸の基準に従って評価してください

評価完了後は、createArticleRating ツールを使用して結果をシステムに保存してください。`;
}

/**
 * 記事内容取得失敗時のフォールバックプロンプト
 */
function generateFallbackPrompt(url: string): string {
	return `# 記事評価タスク（内容取得失敗）

## 記事情報
- **URL**: ${url}
- **状況**: 記事内容の自動取得に失敗しました

## 指示
上記URLにアクセスして記事内容を直接確認し、以下の5つの軸で評価してください：

1. **実用性** (1-10点): 業務や実装で実際に活用できる度合い
2. **技術深度** (1-10点): 技術的な内容の深さ・専門性
3. **理解度** (1-10点): あなたにとっての理解しやすさ
4. **新規性** (1-10点): あなたにとっての新しさ・発見度
5. **重要度** (1-10点): 現在の関心・優先度への適合

## 出力形式
以下のJSON形式で回答してください:

\`\`\`json
{
  "practicalValue": { "score": X, "reason": "理由..." },
  "technicalDepth": { "score": X, "reason": "理由..." },
  "understanding": { "score": X, "reason": "理由..." },
  "novelty": { "score": X, "reason": "理由..." },
  "importance": { "score": X, "reason": "理由..." },
  "comment": "この記事から学んだことや印象を200文字程度でまとめてください"
}
\`\`\`

評価完了後は、createArticleRating ツールを使用して結果をシステムに保存してください。`;
}

if (import.meta.vitest) {
	const { test, expect, describe, vi, beforeEach } = import.meta.vitest;

	// モックブラウザとページの設定
	const createMockPage = () => ({
		goto: vi.fn().mockResolvedValue(undefined),
		$: vi.fn(),
		close: vi.fn().mockResolvedValue(undefined),
		setUserAgent: vi.fn().mockResolvedValue(undefined),
		setViewportSize: vi.fn().mockResolvedValue(undefined),
		evaluate: vi.fn(),
	});

	const createMockBrowser = () => ({
		newPage: vi.fn().mockResolvedValue(createMockPage()),
	});

	describe("fetchArticleContent", () => {
		beforeEach(() => {
			vi.clearAllMocks();
		});

		test("有効なURLとブラウザで記事内容を取得する", async () => {
			const mockPage = createMockPage();
			const mockBrowser = createMockBrowser();

			// ページのevaluateメソッドをモック
			mockPage.evaluate
				.mockResolvedValueOnce(undefined) // 不要要素削除
				.mockResolvedValueOnce([
					{
						"@type": "Article",
						headline: "テスト記事",
						author: { name: "テスト著者" },
					},
				]) // JSON-LD
				.mockResolvedValueOnce({ title: "テスト記事", author: "テスト著者" }) // メタデータ
				.mockResolvedValueOnce("これはテスト記事の内容です。".repeat(10)); // メインコンテンツ

			mockBrowser.newPage.mockResolvedValue(mockPage);

			const result = await fetchArticleContent(
				"https://example.com/article",
				mockBrowser as unknown as Browser,
			);

			expect(result.title).toBe("テスト記事");
			expect(result.extractionMethod).toBe("structured-data");
			expect(result.qualityScore).toBeGreaterThan(0);
			expect(result.metadata.wordCount).toBeGreaterThan(0);
		});

		test("ブラウザなしでフォールバック取得を実行", async () => {
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
			expect(result.extractionMethod).toBe("fallback-html");
			expect(result.qualityScore).toBe(0.3);
		});

		test("無効なURLでエラーを投げる", async () => {
			await expect(fetchArticleContent("invalid-url")).rejects.toThrow(
				"Invalid URL",
			);
		});
	});

	describe("generateRatingPrompt", () => {
		test("高品質記事から詳細なプロンプトを生成する", () => {
			const articleContent: ArticleContent = {
				title: "TypeScript入門",
				content:
					"TypeScriptは型安全性を提供するJavaScriptのスーパーセットです。".repeat(
						10,
					),
				metadata: {
					author: "田中太郎",
					publishedDate: "2024-01-01",
					description: "TypeScript入門記事",
					readingTime: 5,
					wordCount: 500,
				},
				extractionMethod: "structured-data",
				qualityScore: 0.9,
			};

			const prompt = generateRatingPrompt(
				articleContent,
				"https://example.com",
			);

			expect(prompt).toContain("TypeScript入門");
			expect(prompt).toContain("田中太郎");
			expect(prompt).toContain("2024-01-01");
			expect(prompt).toContain("structured-data");
			expect(prompt).toContain("90%"); // 品質スコア
			expect(prompt).toContain("JSON形式");
			expect(prompt).toContain("practicalValue");
		});

		test("記事内容がnullの場合のフォールバックプロンプト", () => {
			const prompt = generateRatingPrompt(null, "https://example.com");

			expect(prompt).toContain("内容取得失敗");
			expect(prompt).toContain("https://example.com");
			expect(prompt).toContain("直接確認");
		});
	});

	describe("calculateQualityScore", () => {
		test("高品質コンテンツのスコア計算", () => {
			const score = calculateQualityScore({
				hasStructuredData: true,
				contentLength: 1000,
				hasMetadata: true,
				hasDescription: true,
			});

			expect(score).toBe(1.0);
		});

		test("低品質コンテンツのスコア計算", () => {
			const score = calculateQualityScore({
				hasStructuredData: false,
				contentLength: 50,
				hasMetadata: false,
				hasDescription: false,
			});

			expect(score).toBeLessThan(0.3);
		});
	});

	describe("サイト別戦略", () => {
		test("Zennの戦略設定が正しい", () => {
			const zennStrategy = SITE_STRATEGIES["zenn.dev"];

			expect(zennStrategy.selectors).toContain(".znc");
			expect(zennStrategy.metadata.author).toContain(".ArticleHeader_author a");
			expect(zennStrategy.excludeSelectors).toContain(".znc_sidebar");
		});

		test("Qiitaの戦略設定が正しい", () => {
			const qiitaStrategy = SITE_STRATEGIES["qiita.com"];

			expect(qiitaStrategy.selectors).toContain(".it-MdContent");
			expect(qiitaStrategy.metadata.author).toContain(".p-items_authorName");
		});

		test("noteの戦略設定が正しい", () => {
			const noteStrategy = SITE_STRATEGIES["note.com"];

			expect(noteStrategy.selectors).toContain(
				".note-common-styles__textnote-body",
			);
			expect(noteStrategy.metadata.author).toContain(
				".o-noteContentHeader__authorName",
			);
		});

		test("Mediumの戦略設定が正しい", () => {
			const mediumStrategy = SITE_STRATEGIES["medium.com"];

			expect(mediumStrategy.selectors).toContain("article section");
			expect(mediumStrategy.metadata.author).toContain(
				'[data-testid="authorName"]',
			);
		});

		test("デフォルト戦略が適用される", () => {
			const defaultStrategy = SITE_STRATEGIES.default;

			expect(defaultStrategy.selectors).toContain("article");
			expect(defaultStrategy.selectors).toContain("main");
			expect(defaultStrategy.fallbackSelectors).toContain("body");
		});
	});

	describe("extractContentFromHTML", () => {
		test("HTMLからタイトルと内容を抽出する", () => {
			const html = `
				<html>
					<head><title>テストタイトル</title></head>
					<body>
						<article>
							<h1>記事タイトル</h1>
							<p>これは記事の内容です。</p>
							<script>console.log('スクリプト');</script>
							<style>.test { color: red; }</style>
						</article>
					</body>
				</html>
			`;

			const result = extractContentFromHTML(html);

			expect(result.title).toBe("テストタイトル");
			expect(result.content).toContain("記事の内容");
			expect(result.content).not.toContain("console.log");
			expect(result.content).not.toContain("color: red");
			expect(result.extractionMethod).toBe("fallback-html");
			expect(result.qualityScore).toBe(0.3);
		});

		test("メタデータ付きHTMLの処理", () => {
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

			const result = extractContentFromHTML(html);

			expect(result.metadata.author).toBe("テスト著者");
			expect(result.metadata.publishedDate).toBe("2024-01-01T12:00:00Z");
			expect(result.metadata.wordCount).toBeGreaterThan(0);
			expect(result.metadata.readingTime).toBeGreaterThan(0);
		});

		test("不正なHTMLの処理", () => {
			const html = "<invalid>html</invalid>";

			const result = extractContentFromHTML(html);

			expect(result.title).toBe("記事タイトル不明");
			expect(result.content).toBe("記事内容の取得に失敗しました");
			expect(result.qualityScore).toBe(0.3);
		});
	});

	describe("fallbackFetchContent", () => {
		test("フォールバック取得が成功する", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				text: async () => `
					<html>
						<head><title>フォールバック記事</title></head>
						<body><p>フォールバック内容です。</p></body>
					</html>
				`,
			});

			const result = await fallbackFetchContent("https://example.com");

			expect(result.title).toBe("フォールバック記事");
			expect(result.content).toContain("フォールバック内容");
			expect(result.extractionMethod).toBe("fallback-html");
		});

		test("HTTPエラー時の例外処理", async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
			});

			await expect(fallbackFetchContent("https://example.com")).rejects.toThrow(
				"HTTP error! status: 404",
			);
		});

		test("ネットワークエラー時の例外処理", async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error("ネットワークエラー"));

			await expect(fallbackFetchContent("https://example.com")).rejects.toThrow(
				"Fallback fetch failed: ネットワークエラー",
			);
		});
	});

	describe("品質スコア計算の詳細テスト", () => {
		test("構造化データがある場合の高スコア", () => {
			const score = calculateQualityScore({
				hasStructuredData: true,
				contentLength: 1500,
				hasMetadata: true,
				hasDescription: true,
			});

			expect(score).toBe(1.0);
		});

		test("中程度の品質スコア", () => {
			const score = calculateQualityScore({
				hasStructuredData: false,
				contentLength: 300,
				hasMetadata: true,
				hasDescription: false,
			});

			expect(score).toBe(0.4); // 0.2 (content) + 0.2 (metadata)
		});

		test("最低品質スコア", () => {
			const score = calculateQualityScore({
				hasStructuredData: false,
				contentLength: 50,
				hasMetadata: false,
				hasDescription: false,
			});

			expect(score).toBe(0.0);
		});

		test("コンテンツ長による段階的スコア", () => {
			const score100 = calculateQualityScore({
				hasStructuredData: false,
				contentLength: 100,
				hasMetadata: false,
				hasDescription: false,
			});
			const score300 = calculateQualityScore({
				hasStructuredData: false,
				contentLength: 300,
				hasMetadata: false,
				hasDescription: false,
			});
			const score600 = calculateQualityScore({
				hasStructuredData: false,
				contentLength: 600,
				hasMetadata: false,
				hasDescription: false,
			});

			expect(score100).toBe(0.1);
			expect(score300).toBe(0.2);
			expect(score600).toBe(0.3);
		});
	});

	describe("評価プロンプト生成の詳細テスト", () => {
		test("完全な記事情報でのプロンプト生成", () => {
			const articleContent: ArticleContent = {
				title: "React Hooks完全ガイド",
				content: "React Hooksについての詳細な解説...".repeat(50),
				metadata: {
					author: "React専門家",
					publishedDate: "2024-01-15T10:00:00Z",
					description: "React Hooksの使い方を詳しく解説",
					readingTime: 10,
					wordCount: 1000,
					tags: ["React", "JavaScript", "Frontend"],
					language: "ja",
				},
				extractionMethod: "structured-data",
				qualityScore: 0.95,
			};

			const prompt = generateRatingPrompt(
				articleContent,
				"https://react-guide.com",
			);

			expect(prompt).toContain("React Hooks完全ガイド");
			expect(prompt).toContain("React専門家");
			expect(prompt).toContain("2024-01-15");
			expect(prompt).toContain("10分");
			expect(prompt).toContain("1000文字");
			expect(prompt).toContain("95%");
			expect(prompt).toContain("React Hooksの使い方");
			expect(prompt).toContain("practicalValue");
			expect(prompt).toContain("createArticleRating");
		});

		test("最小限の記事情報でのプロンプト生成", () => {
			const articleContent: ArticleContent = {
				title: "最小記事",
				content: "短い内容",
				metadata: {},
				extractionMethod: "generic-selectors",
				qualityScore: 0.2,
			};

			const prompt = generateRatingPrompt(
				articleContent,
				"https://minimal.com",
			);

			expect(prompt).toContain("最小記事");
			expect(prompt).toContain("N/A"); // 不明な情報
			expect(prompt).toContain("20%"); // 品質スコア
			expect(prompt).toContain("generic-selectors");
		});

		test("長いコンテンツの切り詰め処理", () => {
			const longContent = "長いテキスト ".repeat(500); // 2000文字を超える
			const articleContent: ArticleContent = {
				title: "長い記事",
				content: longContent,
				metadata: {},
				extractionMethod: "structured-data",
				qualityScore: 0.8,
			};

			const prompt = generateRatingPrompt(articleContent, "https://long.com");

			expect(prompt).toContain("長いテキスト");
			expect(prompt).toContain("..."); // 切り詰めを示す
			expect(prompt.length).toBeLessThan(longContent.length + 1000); // 適切に切り詰められている
		});

		test("フォールバックプロンプトのテスト", () => {
			const prompt = generateFallbackPrompt("https://example.com/test");

			expect(prompt).toContain("内容取得失敗");
			expect(prompt).toContain("https://example.com/test");
			expect(prompt).toContain("直接確認");
			expect(prompt).toContain("practicalValue");
			expect(prompt).toContain("createArticleRating");
		});

		test("プロンプト内のEVALUATION_PROMPTSの使用", () => {
			const articleContent: ArticleContent = {
				title: "テスト記事",
				content: "テスト内容",
				metadata: { author: "テスト著者" },
				extractionMethod: "test",
				qualityScore: 0.5,
			};

			const prompt = generateRatingPrompt(articleContent, "https://test.com");

			// 各評価軸のプロンプトが含まれているか確認
			expect(prompt).toContain("実用性評価");
			expect(prompt).toContain("技術深度評価");
			expect(prompt).toContain("理解度評価");
			expect(prompt).toContain("新規性評価");
			expect(prompt).toContain("重要度評価");
		});
	});

	describe("抽出戦略の詳細テスト", () => {
		test("getExtractionStrategies関数の戦略一覧", () => {
			const strategies = getExtractionStrategies();

			expect(strategies).toHaveLength(4);
			expect(strategies[0].name).toBe("structured-data");
			expect(strategies[1].name).toBe("semantic-elements");
			expect(strategies[2].name).toBe("site-specific");
			expect(strategies[3].name).toBe("generic-selectors");

			// 優先度の確認
			expect(strategies[0].priority).toBe(1);
			expect(strategies[1].priority).toBe(2);
			expect(strategies[2].priority).toBe(3);
			expect(strategies[3].priority).toBe(4);
		});

		test("品質スコア閾値の確認", () => {
			const strategies = getExtractionStrategies();

			expect(
				strategies[0].validate({ qualityScore: 0.8 } as ArticleContent),
			).toBe(true);
			expect(
				strategies[0].validate({ qualityScore: 0.7 } as ArticleContent),
			).toBe(false);

			expect(
				strategies[1].validate({ qualityScore: 0.6 } as ArticleContent),
			).toBe(true);
			expect(
				strategies[1].validate({ qualityScore: 0.5 } as ArticleContent),
			).toBe(false);

			expect(
				strategies[2].validate({ qualityScore: 0.7 } as ArticleContent),
			).toBe(true);
			expect(
				strategies[2].validate({ qualityScore: 0.6 } as ArticleContent),
			).toBe(false);

			expect(
				strategies[3].validate({ qualityScore: 0.4 } as ArticleContent),
			).toBe(true);
			expect(
				strategies[3].validate({ qualityScore: 0.3 } as ArticleContent),
			).toBe(false);
		});
	});
}
