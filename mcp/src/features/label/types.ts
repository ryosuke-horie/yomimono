/**
 * ラベル機能で使用する型定義
 */

import { z } from "zod";

/**
 * ラベルのスキーマ定義
 */
export const LabelSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

/**
 * ラベル型
 */
export type Label = z.infer<typeof LabelSchema>;

/**
 * 記事のスキーマ定義
 */
export const ArticleSchema = z.object({
	id: z.number(),
	title: z.string(),
	url: z.string(),
});

/**
 * 記事型
 */
export type Article = z.infer<typeof ArticleSchema>;
