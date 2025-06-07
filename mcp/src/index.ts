import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as dotenv from "dotenv";
import { z } from "zod";
import * as apiClient from "./lib/apiClient.js";
import {
	type ArticleContent,
	fetchArticleContent,
	generateRatingPrompt,
} from "./lib/articleContentFetcher.js";

// Configure dotenv to load environment variables
dotenv.config();

// Create an MCP server instance
const server = new McpServer({
	name: "EffectiveYomimonoLabeler", // Descriptive name for the server
	version: "0.6.0", // Phase 2: Advanced MCP rating tools with filtering, stats, and bulk operations
});

// --- Tool Definitions ---

// 1. Tool to get unlabeled articles
server.tool(
	"getUnlabeledArticles",
	{}, // No input arguments
	async () => {
		try {
			const articles = await apiClient.getUnlabeledArticles();
			// Return the list of articles directly. Client needs to handle the structure.
			// We'll stringify it here for simple text output, but a structured format might be better.
			return {
				content: [{ type: "text", text: JSON.stringify(articles, null, 2) }],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getUnlabeledArticles tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `Error fetching unlabeled articles: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 2. Tool to get existing labels
server.tool(
	"getLabels",
	{}, // No input arguments
	async () => {
		try {
			const labels = await apiClient.getLabels();
			// Return the list of labels directly.
			return {
				content: [{ type: "text", text: JSON.stringify(labels, null, 2) }],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getLabels tool:", errorMessage);
			return {
				content: [
					{ type: "text", text: `Error fetching labels: ${errorMessage}` },
				],
				isError: true,
			};
		}
	},
);

// 3. Tool to assign a label to an article
server.tool(
	"assignLabel",
	// Define input arguments schema using Zod
	{
		articleId: z.number().int().positive(),
		labelName: z.string().min(1),
		description: z.string().optional().nullable(),
	},
	async ({ articleId, labelName, description }) => {
		// Destructure arguments
		try {
			await apiClient.assignLabelToArticle(
				articleId,
				labelName,
				description ?? undefined,
			);
			return {
				content: [
					{
						type: "text",
						text: `Successfully assigned label "${labelName}" to article ID ${articleId}.`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in assignLabel tool (articleId: ${articleId}, labelName: ${labelName}, description: ${description}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to assign label: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 4. Tool to create a new label
server.tool(
	"createLabel",
	// Define input arguments schema using Zod
	{
		labelName: z.string().min(1, "Label name cannot be empty"),
		description: z.string().optional().nullable(),
	},
	async ({ labelName, description }) => {
		// Destructure arguments
		try {
			const newLabel = await apiClient.createLabel(
				labelName,
				description ?? undefined,
			);
			return {
				content: [
					{
						type: "text",
						text: `Successfully created label: ${JSON.stringify(newLabel, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in createLabel tool (labelName: ${labelName}, description: ${description}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to create label: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 5. Tool to get a label by ID
server.tool(
	"getLabelById",
	{
		labelId: z.number().int().positive(),
	},
	async ({ labelId }) => {
		try {
			const label = await apiClient.getLabelById(labelId);
			return {
				content: [
					{
						type: "text",
						text: `Label details: ${JSON.stringify(label, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in getLabelById tool (labelId: ${labelId}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to get label: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 6. Tool to delete a label
server.tool(
	"deleteLabel",
	{
		labelId: z.number().int().positive(),
	},
	async ({ labelId }) => {
		try {
			await apiClient.deleteLabel(labelId);
			return {
				content: [
					{
						type: "text",
						text: `Successfully deleted label ID ${labelId}.`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in deleteLabel tool (labelId: ${labelId}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to delete label: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 7. Tool to update a label's description
server.tool(
	"updateLabelDescription",
	{
		labelId: z.number().int().positive(),
		description: z.string().nullable(),
	},
	async ({ labelId, description }) => {
		try {
			const updatedLabel = await apiClient.updateLabelDescription(
				labelId,
				description,
			);
			return {
				content: [
					{
						type: "text",
						text: `Successfully updated label description: ${JSON.stringify(updatedLabel, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in updateLabelDescription tool (labelId: ${labelId}, description: ${description}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to update label description: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 8. Tool to assign labels to multiple articles
server.tool(
	"assignLabelsToMultipleArticles",
	// Define input arguments schema using Zod
	{
		articleIds: z.array(z.number().int().positive()),
		labelName: z.string().min(1),
		description: z.string().optional().nullable(),
	},
	async ({ articleIds, labelName, description }) => {
		// Destructure arguments
		try {
			const result = await apiClient.assignLabelsToMultipleArticles(
				articleIds,
				labelName,
				description ?? undefined,
			);
			return {
				content: [
					{
						type: "text",
						text: `Successfully batch assigned label "${labelName}" to articles. Result: ${JSON.stringify(result, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in assignLabelsToMultipleArticles tool (articleIds: ${articleIds}, labelName: ${labelName}, description: ${description}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to batch assign labels: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 12. Tool to get bookmark by ID
server.tool(
	"getBookmarkById",
	{
		bookmarkId: z.number().int().positive(),
	},
	async ({ bookmarkId }) => {
		try {
			const bookmark = await apiClient.getBookmarkById(bookmarkId);
			return {
				content: [
					{
						type: "text",
						text: `Bookmark details: ${JSON.stringify(bookmark, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in getBookmarkById tool (bookmarkId: ${bookmarkId}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to get bookmark: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 13. Tool to get unread articles by label
server.tool(
	"getUnreadArticlesByLabel",
	{
		labelName: z.string().min(1),
	},
	async ({ labelName }) => {
		try {
			const articles = await apiClient.getUnreadArticlesByLabel(labelName);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(articles, null, 2),
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in getUnreadArticlesByLabel tool (labelName: ${labelName}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `Failed to get unread articles by label: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 14. Tool to get unread bookmarks
server.tool(
	"getUnreadBookmarks",
	{}, // No input arguments
	async () => {
		try {
			const bookmarks = await apiClient.getUnreadBookmarks();
			return {
				content: [
					{
						type: "text",
						text: `未読のブックマークリスト:\n${JSON.stringify(bookmarks, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getUnreadBookmarks tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `未読ブックマークの取得に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 15. Tool to get read bookmarks
server.tool(
	"getReadBookmarks",
	{}, // No input arguments
	async () => {
		try {
			const bookmarks = await apiClient.getReadBookmarks();
			return {
				content: [
					{
						type: "text",
						text: `既読のブックマークリスト:\n${JSON.stringify(bookmarks, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getReadBookmarks tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `既読ブックマークの取得に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 16. Tool to mark bookmark as read
server.tool(
	"markBookmarkAsRead",
	{
		bookmarkId: z.number().int().positive(),
	},
	async ({ bookmarkId }) => {
		try {
			const result = await apiClient.markBookmarkAsRead(bookmarkId);
			return {
				content: [
					{
						type: "text",
						text: `ブックマークID: ${bookmarkId}を既読にマークしました。\n${JSON.stringify(result, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error(
				`Error in markBookmarkAsRead tool (bookmarkId: ${bookmarkId}):`,
				errorMessage,
			);
			return {
				content: [
					{
						type: "text",
						text: `ブックマークの既読マークに失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// --- 記事評価ポイント機能のMCPツール ---

// 17. Tool to prepare article rating with content fetching
server.tool(
	"rateArticleWithContent",
	{
		articleId: z.number().int().positive(),
		url: z.string().url(),
		fetchContent: z.boolean().default(true),
	},
	async ({ articleId, url, fetchContent }) => {
		try {
			let articleContent: ArticleContent | null = null;

			if (fetchContent) {
				try {
					articleContent = await fetchArticleContent(url);
				} catch (error: unknown) {
					const errorMessage =
						error instanceof Error ? error.message : String(error);
					console.error(
						`Failed to fetch article content for ${url}:`,
						errorMessage,
					);
					// 記事内容取得に失敗してもプロンプト生成は続行
				}
			}

			// 評価プロンプトを生成
			const evaluationPrompt = generateRatingPrompt(articleContent, url);

			const contentSummary = articleContent
				? `- タイトル: ${articleContent.title}
- 著者: ${articleContent.metadata.author || "N/A"}
- 公開日: ${articleContent.metadata.publishedDate || "N/A"}
- 読み時間: ${articleContent.metadata.readingTime || "N/A"}分
- 内容プレビュー: ${articleContent.content.substring(0, 200)}${articleContent.content.length > 200 ? "..." : ""}`
				: "記事内容の取得に失敗しました。URLを直接確認して評価を行ってください。";

			return {
				content: [
					{
						type: "text",
						text: `記事ID ${articleId} の評価準備が完了しました。

## 記事情報
- URL: ${url}
${contentSummary}

## 評価プロンプト
以下のプロンプトを参考に記事を評価し、createArticleRating ツールで結果を保存してください:

${evaluationPrompt}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in rateArticleWithContent tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `記事評価の準備に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 18. Tool to create article rating
server.tool(
	"createArticleRating",
	{
		articleId: z.number().int().positive(),
		practicalValue: z.number().int().min(1).max(10),
		technicalDepth: z.number().int().min(1).max(10),
		understanding: z.number().int().min(1).max(10),
		novelty: z.number().int().min(1).max(10),
		importance: z.number().int().min(1).max(10),
		comment: z.string().optional(),
	},
	async ({
		articleId,
		practicalValue,
		technicalDepth,
		understanding,
		novelty,
		importance,
		comment,
	}) => {
		try {
			const ratingData: apiClient.CreateRatingData = {
				practicalValue,
				technicalDepth,
				understanding,
				novelty,
				importance,
				comment,
			};

			const rating = await apiClient.createArticleRating(articleId, ratingData);

			return {
				content: [
					{
						type: "text",
						text: `記事評価を作成しました:

記事ID: ${articleId}
評価詳細:
- 実用性: ${practicalValue}点
- 技術深度: ${technicalDepth}点
- 理解度: ${understanding}点
- 新規性: ${novelty}点
- 重要度: ${importance}点
- 総合スコア: ${rating.totalScore}点

${comment ? `コメント: ${comment}` : ""}

評価ID: ${rating.id}
作成日時: ${rating.createdAt}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in createArticleRating tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `記事評価の作成に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 19. Tool to get article rating
server.tool(
	"getArticleRating",
	{
		articleId: z.number().int().positive(),
	},
	async ({ articleId }) => {
		try {
			const rating = await apiClient.getArticleRating(articleId);

			if (!rating) {
				return {
					content: [
						{
							type: "text",
							text: `記事ID ${articleId} の評価は見つかりませんでした。`,
						},
					],
					isError: false,
				};
			}

			return {
				content: [
					{
						type: "text",
						text: `記事ID ${articleId} の評価:

評価詳細:
- 実用性: ${rating.practicalValue}点
- 技術深度: ${rating.technicalDepth}点
- 理解度: ${rating.understanding}点
- 新規性: ${rating.novelty}点
- 重要度: ${rating.importance}点
- 総合スコア: ${rating.totalScore}点

${rating.comment ? `コメント: ${rating.comment}` : "コメントなし"}

評価ID: ${rating.id}
作成日時: ${rating.createdAt}
更新日時: ${rating.updatedAt}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getArticleRating tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `記事評価の取得に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 20. Tool to update article rating
server.tool(
	"updateArticleRating",
	{
		articleId: z.number().int().positive(),
		practicalValue: z.number().int().min(1).max(10).optional(),
		technicalDepth: z.number().int().min(1).max(10).optional(),
		understanding: z.number().int().min(1).max(10).optional(),
		novelty: z.number().int().min(1).max(10).optional(),
		importance: z.number().int().min(1).max(10).optional(),
		comment: z.string().optional(),
	},
	async ({
		articleId,
		practicalValue,
		technicalDepth,
		understanding,
		novelty,
		importance,
		comment,
	}) => {
		try {
			const updateData: apiClient.UpdateRatingData = {};

			if (practicalValue !== undefined)
				updateData.practicalValue = practicalValue;
			if (technicalDepth !== undefined)
				updateData.technicalDepth = technicalDepth;
			if (understanding !== undefined) updateData.understanding = understanding;
			if (novelty !== undefined) updateData.novelty = novelty;
			if (importance !== undefined) updateData.importance = importance;
			if (comment !== undefined) updateData.comment = comment;

			// 少なくとも1つのフィールドが更新される必要がある
			if (Object.keys(updateData).length === 0) {
				return {
					content: [
						{
							type: "text",
							text: "更新するデータが指定されていません。少なくとも1つのフィールドを指定してください。",
						},
					],
					isError: true,
				};
			}

			const rating = await apiClient.updateArticleRating(articleId, updateData);

			const updatedFields = Object.entries(updateData)
				.map(([key, value]) => {
					const fieldNames: Record<string, string> = {
						practicalValue: "実用性",
						technicalDepth: "技術深度",
						understanding: "理解度",
						novelty: "新規性",
						importance: "重要度",
						comment: "コメント",
					};
					return `- ${fieldNames[key] || key}: ${value}`;
				})
				.join("\n");

			return {
				content: [
					{
						type: "text",
						text: `記事ID ${articleId} の評価を更新しました:

更新された項目:
${updatedFields}

現在の評価:
- 実用性: ${rating.practicalValue}点
- 技術深度: ${rating.technicalDepth}点
- 理解度: ${rating.understanding}点
- 新規性: ${rating.novelty}点
- 重要度: ${rating.importance}点
- 総合スコア: ${rating.totalScore}点

${rating.comment ? `コメント: ${rating.comment}` : "コメントなし"}

更新日時: ${rating.updatedAt}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in updateArticleRating tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `記事評価の更新に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// --- Phase 2: 高度なMCP機能ツール ---

// 21. Tool to get article ratings list with filters and sorting
server.tool(
	"getArticleRatings",
	{
		sortBy: z
			.enum([
				"totalScore",
				"createdAt",
				"practicalValue",
				"technicalDepth",
				"understanding",
				"novelty",
				"importance",
			])
			.optional(),
		order: z.enum(["asc", "desc"]).optional(),
		limit: z.number().int().positive().max(100).optional(),
		offset: z.number().int().min(0).optional(),
		minScore: z.number().min(1).max(10).optional(),
		maxScore: z.number().min(1).max(10).optional(),
		hasComment: z.boolean().optional(),
	},
	async (params) => {
		try {
			const ratings = await apiClient.getArticleRatings(params);

			// フォーマット用のヘルパー関数
			const formatRatingForDisplay = (rating: {
				id: number;
				articleId: number;
				practicalValue: number;
				technicalDepth: number;
				understanding: number;
				novelty: number;
				importance: number;
				totalScore: number;
				comment: string | null;
				createdAt: string;
			}) => {
				const totalScore = (rating.totalScore / 10).toFixed(1);
				return `📊 評価ID: ${rating.id}
   記事ID: ${rating.articleId}
   📈 総合スコア: ${totalScore}/10
   📋 詳細評価:
      • 実用性: ${rating.practicalValue}/10
      • 技術深度: ${rating.technicalDepth}/10  
      • 理解度: ${rating.understanding}/10
      • 新規性: ${rating.novelty}/10
      • 重要度: ${rating.importance}/10
   💭 コメント: ${rating.comment || "なし"}
   📅 作成日: ${new Date(rating.createdAt).toLocaleDateString("ja-JP")}`;
			};

			const formatted = ratings.map(formatRatingForDisplay).join("\n\n");

			// ソート・フィルター情報
			const filterInfo = [];
			if (params.sortBy)
				filterInfo.push(`ソート: ${params.sortBy} (${params.order || "asc"})`);
			if (params.minScore || params.maxScore) {
				const min = params.minScore || 1;
				const max = params.maxScore || 10;
				filterInfo.push(`スコア範囲: ${min}-${max}`);
			}
			if (params.hasComment !== undefined) {
				filterInfo.push(`コメント: ${params.hasComment ? "あり" : "なし"}`);
			}

			return {
				content: [
					{
						type: "text",
						text: `📊 記事評価一覧 (${ratings.length}件)
${filterInfo.length > 0 ? `\n🔍 フィルター条件: ${filterInfo.join(", ")}\n` : ""}
${formatted || "📭 条件に合致する評価がありません"}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getArticleRatings tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `記事評価一覧の取得に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 22. Tool to get rating statistics
server.tool(
	"getRatingStats",
	{}, // No parameters needed
	async () => {
		try {
			const stats = await apiClient.getRatingStats();

			const summary = `📈 記事評価統計情報

## サマリー
📊 総評価数: ${stats.totalRatings}件
⭐ 平均スコア: ${stats.averageScore.toFixed(1)}/10
📊 中央値: ${stats.medianScore.toFixed(1)}/10

## 評価軸別平均
🔧 実用性: ${stats.dimensionAverages.practicalValue.toFixed(1)}/10
🧠 技術深度: ${stats.dimensionAverages.technicalDepth.toFixed(1)}/10
📚 理解度: ${stats.dimensionAverages.understanding.toFixed(1)}/10
✨ 新規性: ${stats.dimensionAverages.novelty.toFixed(1)}/10
⚡ 重要度: ${stats.dimensionAverages.importance.toFixed(1)}/10

## スコア分布
${stats.scoreDistribution
	.map((d) => `${d.range}: ${d.count}件 (${d.percentage.toFixed(1)}%)`)
	.join("\n")}

## 高評価記事 Top 5
${stats.topRatedArticles
	.slice(0, 5)
	.map(
		(article, i) =>
			`${i + 1}. ${article.title} (${(article.totalScore / 10).toFixed(1)}/10)\n   URL: ${article.url}`,
	)
	.join("\n\n")}`;

			return {
				content: [{ type: "text", text: summary }],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getRatingStats tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `評価統計情報の取得に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 23. Tool to get top rated articles (convenience wrapper)
server.tool(
	"getTopRatedArticles",
	{
		limit: z.number().int().positive().max(50).optional().default(10),
	},
	async ({ limit }) => {
		try {
			const ratings = await apiClient.getArticleRatings({
				sortBy: "totalScore",
				order: "desc",
				limit,
			});

			if (ratings.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: "📭 評価された記事がありません",
						},
					],
					isError: false,
				};
			}

			const formatted = ratings
				.map(
					(rating, index) =>
						`${index + 1}. 📊 スコア: ${(rating.totalScore / 10).toFixed(1)}/10
   🆔 記事ID: ${rating.articleId}
   📋 評価内訳: 実用${rating.practicalValue} | 技術${rating.technicalDepth} | 理解${rating.understanding} | 新規${rating.novelty} | 重要${rating.importance}
   💭 ${rating.comment || "コメントなし"}`,
				)
				.join("\n\n");

			return {
				content: [
					{
						type: "text",
						text: `🏆 高評価記事 Top ${limit}\n\n${formatted}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getTopRatedArticles tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `高評価記事の取得に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 24. Tool for bulk rating multiple articles
server.tool(
	"bulkRateArticles",
	{
		ratings: z
			.array(
				z.object({
					articleId: z.number().int().positive(),
					practicalValue: z.number().int().min(1).max(10),
					technicalDepth: z.number().int().min(1).max(10),
					understanding: z.number().int().min(1).max(10),
					novelty: z.number().int().min(1).max(10),
					importance: z.number().int().min(1).max(10),
					comment: z.string().optional(),
				}),
			)
			.max(10), // 一度に最大10件
	},
	async ({ ratings }) => {
		try {
			const results = await Promise.allSettled(
				ratings.map((ratingData) => {
					const { articleId, ...ratingFields } = ratingData;
					return apiClient.createArticleRating(articleId, ratingFields);
				}),
			);

			const succeeded = results.filter((r) => r.status === "fulfilled").length;
			const failed = results.filter((r) => r.status === "rejected").length;

			const successfulRatings = results
				.map((result, index) => ({ result, originalData: ratings[index] }))
				.filter(({ result }) => result.status === "fulfilled")
				.map(({ result, originalData }) => ({
					...(
						result as PromiseFulfilledResult<{ totalScore: number; id: number }>
					).value,
					originalArticleId: originalData.articleId,
				}));

			const failedRatings = results
				.map((result, index) => ({ result, originalData: ratings[index] }))
				.filter(({ result }) => result.status === "rejected")
				.map(({ result, originalData }) => ({
					articleId: originalData.articleId,
					error: (result as PromiseRejectedResult).reason,
				}));

			let responseText = `📝 一括評価完了\n✅ 成功: ${succeeded}件 | ❌ 失敗: ${failed}件`;

			if (successfulRatings.length > 0) {
				responseText += "\n\n✅ 成功した評価:\n";
				responseText += successfulRatings
					.map(
						(rating) =>
							`• 記事ID ${rating.originalArticleId}: 総合スコア ${(rating.totalScore / 10).toFixed(1)}/10`,
					)
					.join("\n");
			}

			if (failedRatings.length > 0) {
				responseText += "\n\n❌ 失敗した評価:\n";
				responseText += failedRatings
					.map((failure) => `• 記事ID ${failure.articleId}: ${failure.error}`)
					.join("\n");
			}

			return {
				content: [
					{
						type: "text",
						text: responseText,
					},
				],
				isError: failed > 0,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in bulkRateArticles tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `一括評価の実行に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// 25. Tool to get unrated articles
server.tool(
	"getUnratedArticles",
	{}, // No input arguments
	async () => {
		try {
			const articles = await apiClient.getUnratedArticles();
			return {
				content: [
					{
						type: "text",
						text: `未評価記事リスト:\n${JSON.stringify(articles, null, 2)}`,
					},
				],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			console.error("Error in getUnratedArticles tool:", errorMessage);
			return {
				content: [
					{
						type: "text",
						text: `未評価記事の取得に失敗しました: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	},
);

// --- End Tool Definition ---

async function main() {
	// Use Stdio transport for initial development
	const transport = new StdioServerTransport();

	try {
		// Connect the server to the transport
		await server.connect(transport);
	} catch (error) {
		// Keep console.error for actual errors (goes to stderr)
		console.error("Failed to connect MCP server:", error);
		process.exit(1); // Exit if connection fails
	}
}

main();
