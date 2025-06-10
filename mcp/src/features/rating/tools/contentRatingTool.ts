/**
 * 記事内容を取得して評価するMCPツール
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
	type ArticleContent,
	fetchArticleContent,
	generateRatingPrompt,
} from "../../../lib/content/articleContentFetcher.js";

/**
 * 記事内容評価ツールを登録する
 * @param server MCPサーバーインスタンス
 */
export function registerContentRatingTool(server: McpServer) {
	// 記事内容を取得して評価準備
	server.tool(
		"rateArticleWithContent",
		{
			articleId: z.number().int().positive(),
			url: z.string().url(),
			fetchContent: z.boolean().default(true),
		},
		async ({ articleId, url, fetchContent }) => {
			try {
				if (!fetchContent) {
					const prompt = generateRatingPrompt(null, url);
					return {
						content: [
							{
								type: "text",
								text: `Rating prompt for article ID ${articleId}:\n\n${prompt}`,
							},
						],
						isError: false,
					};
				}

				// 記事内容を取得
				const articleContent: ArticleContent = await fetchArticleContent(url);

				// 評価用プロンプトを生成
				const prompt = generateRatingPrompt(articleContent, url);

				// 記事情報と評価プロンプトを含む応答を返す
				return {
					content: [
						{
							type: "text",
							text: `Article ID: ${articleId}\nTitle: ${articleContent.title}\nURL: ${url}\n\nContent preview (first 500 chars):\n${articleContent.content.substring(0, 500)}...\n\n===== RATING PROMPT =====\n${prompt}`,
						},
					],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{
							type: "text",
							text: `Error fetching article content: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
