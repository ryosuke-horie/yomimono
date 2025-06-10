/**
 * ブックマーク管理機能のMCPツール定義
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as bookmarkService from "../services/bookmarkService.js";

/**
 * ブックマーク関連のMCPツールを登録する
 * @param server MCPサーバーインスタンス
 */
export function registerBookmarkTools(server: McpServer) {
	// 1. IDでブックマークを取得
	server.tool(
		"getBookmarkById",
		{
			bookmarkId: z.number().int().positive(),
		},
		async ({ bookmarkId }) => {
			try {
				const bookmark = await bookmarkService.getBookmarkById(bookmarkId);
				return {
					content: [{ type: "text", text: JSON.stringify(bookmark, null, 2) }],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{ type: "text", text: `Error fetching bookmark: ${errorMessage}` },
					],
					isError: true,
				};
			}
		},
	);

	// 2. ラベル別の未読記事を取得
	server.tool(
		"getUnreadArticlesByLabel",
		{
			labelName: z.string().min(1),
		},
		async ({ labelName }) => {
			try {
				const articles =
					await bookmarkService.getUnreadArticlesByLabel(labelName);
				return {
					content: [{ type: "text", text: JSON.stringify(articles, null, 2) }],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{
							type: "text",
							text: `Error fetching unread articles by label: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	// 3. 未読ブックマーク一覧を取得
	server.tool("getUnreadBookmarks", {}, async () => {
		try {
			const bookmarks = await bookmarkService.getUnreadBookmarks();
			return {
				content: [{ type: "text", text: JSON.stringify(bookmarks, null, 2) }],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			return {
				content: [
					{
						type: "text",
						text: `Error fetching unread bookmarks: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	});

	// 4. 既読ブックマーク一覧を取得
	server.tool("getReadBookmarks", {}, async () => {
		try {
			const bookmarks = await bookmarkService.getReadBookmarks();
			return {
				content: [{ type: "text", text: JSON.stringify(bookmarks, null, 2) }],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			return {
				content: [
					{
						type: "text",
						text: `Error fetching read bookmarks: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	});

	// 5. ブックマークを既読にマーク
	server.tool(
		"markBookmarkAsRead",
		{
			bookmarkId: z.number().int().positive(),
		},
		async ({ bookmarkId }) => {
			try {
				await bookmarkService.markBookmarkAsRead(bookmarkId);
				return {
					content: [
						{
							type: "text",
							text: `Successfully marked bookmark ID ${bookmarkId} as read.`,
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
							text: `Error marking bookmark as read: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	// 6. 未評価の記事を取得
	server.tool("getUnratedArticles", {}, async () => {
		try {
			const articles = await bookmarkService.getUnratedArticles();
			return {
				content: [{ type: "text", text: JSON.stringify(articles, null, 2) }],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			return {
				content: [
					{
						type: "text",
						text: `Error fetching unrated articles: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	});
}
