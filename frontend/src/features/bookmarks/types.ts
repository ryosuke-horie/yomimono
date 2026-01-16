import type { BookmarkWithFavorite } from "@/lib/openapi/browser/schemas";

/**
 * OpenAPI 生成型を参照したブックマーク型
 */
export type Bookmark = BookmarkWithFavorite;
// 互換性のため BookmarkWithLabel を維持（後で削除予定）
export type BookmarkWithLabel = BookmarkWithFavorite;
