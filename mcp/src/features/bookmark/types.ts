/**
 * ブックマーク機能で使用する型定義
 */

import { z } from "zod";

/**
 * ブックマークのスキーマ定義
 */
export const BookmarkSchema = z.object({
	id: z.number(),
	title: z.string(),
	url: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
	isFavorite: z.boolean(),
	isRead: z.boolean(),
});

/**
 * ブックマーク型
 */
export type Bookmark = z.infer<typeof BookmarkSchema>;
