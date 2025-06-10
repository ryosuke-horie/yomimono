/**
 * ラベル管理機能のMCPツール定義
 * MCPサーバーに登録されるツールのハンドラーを提供
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as labelService from "../services/labelService.js";

/**
 * ラベル関連のMCPツールを登録する
 * @param server MCPサーバーインスタンス
 */
export function registerLabelTools(server: McpServer) {
	// 1. ラベルのない記事を取得
	server.tool("getUnlabeledArticles", {}, async () => {
		try {
			const articles = await labelService.getUnlabeledArticles();
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
						text: `Error fetching unlabeled articles: ${errorMessage}`,
					},
				],
				isError: true,
			};
		}
	});

	// 2. 既存のラベル一覧を取得
	server.tool("getLabels", {}, async () => {
		try {
			const labels = await labelService.getLabels();
			return {
				content: [{ type: "text", text: JSON.stringify(labels, null, 2) }],
				isError: false,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			return {
				content: [
					{ type: "text", text: `Error fetching labels: ${errorMessage}` },
				],
				isError: true,
			};
		}
	});

	// 3. 記事にラベルを割り当て
	server.tool(
		"assignLabel",
		{
			articleId: z.number().int().positive(),
			labelName: z.string().min(1),
			description: z.string().optional().nullable(),
		},
		async ({ articleId, labelName, description }) => {
			try {
				await labelService.assignLabelToArticle(
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
				return {
					content: [
						{
							type: "text",
							text: `Error assigning label: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	// 4. 新しいラベルを作成
	server.tool(
		"createLabel",
		{
			labelName: z.string().min(1),
			description: z.string().optional().nullable(),
		},
		async ({ labelName, description }) => {
			try {
				const label = await labelService.createLabel(
					labelName,
					description ?? undefined,
				);
				return {
					content: [
						{
							type: "text",
							text: `Successfully created label "${labelName}" with ID ${label.id}.`,
						},
					],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{ type: "text", text: `Error creating label: ${errorMessage}` },
					],
					isError: true,
				};
			}
		},
	);

	// 5. IDでラベルを取得
	server.tool(
		"getLabelById",
		{
			labelId: z.number().int().positive(),
		},
		async ({ labelId }) => {
			try {
				const label = await labelService.getLabelById(labelId);
				return {
					content: [{ type: "text", text: JSON.stringify(label, null, 2) }],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{ type: "text", text: `Error fetching label: ${errorMessage}` },
					],
					isError: true,
				};
			}
		},
	);

	// 6. ラベルを削除
	server.tool(
		"deleteLabel",
		{
			labelId: z.number().int().positive(),
		},
		async ({ labelId }) => {
			try {
				await labelService.deleteLabel(labelId);
				return {
					content: [
						{
							type: "text",
							text: `Successfully deleted label with ID ${labelId}.`,
						},
					],
					isError: false,
				};
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				return {
					content: [
						{ type: "text", text: `Error deleting label: ${errorMessage}` },
					],
					isError: true,
				};
			}
		},
	);

	// 7. ラベルの説明を更新
	server.tool(
		"updateLabelDescription",
		{
			labelId: z.number().int().positive(),
			description: z.union([z.string(), z.null()]),
		},
		async ({ labelId, description }) => {
			try {
				await labelService.updateLabelDescription(labelId, description);
				return {
					content: [
						{
							type: "text",
							text: `Successfully updated description for label ID ${labelId}.`,
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
							text: `Error updating label description: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		},
	);

	// 8. 複数の記事に一括でラベルを割り当て
	server.tool(
		"assignLabelsToMultipleArticles",
		{
			articleIds: z.array(z.number().int().positive()),
			labelName: z.string().min(1),
			description: z.string().optional().nullable(),
		},
		async ({ articleIds, labelName, description }) => {
			try {
				await labelService.assignLabelsToMultipleArticles(
					articleIds,
					labelName,
					description ?? undefined,
				);
				return {
					content: [
						{
							type: "text",
							text: `Successfully assigned label "${labelName}" to ${articleIds.length} articles.`,
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
							text: `Error assigning labels to multiple articles: ${errorMessage}`,
						},
					],
					isError: true,
				};
			}
		},
	);
}
