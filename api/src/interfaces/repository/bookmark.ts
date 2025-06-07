import type { Bookmark, InsertBookmark, Label } from "../../db/schema";

type BookmarkWithFavorite = Bookmark & { isFavorite: boolean };
export type BookmarkWithLabel = BookmarkWithFavorite & {
	label: Label | null; // ラベルは存在しない場合もあるためnull許容
};

export interface IBookmarkRepository {
	createMany(bookmarks: InsertBookmark[]): Promise<void>;
	findUnread(): Promise<BookmarkWithLabel[]>;
	findByUrls(urls: string[]): Promise<BookmarkWithLabel[]>;
	markAsRead(id: number): Promise<boolean>;
	markAsUnread(id: number): Promise<boolean>;
	countUnread(): Promise<number>;
	countTodayRead(): Promise<number>;
	addToFavorites(bookmarkId: number): Promise<void>;
	removeFromFavorites(bookmarkId: number): Promise<void>;
	getFavoriteBookmarks(
		offset: number,
		limit: number,
	): Promise<{
		bookmarks: BookmarkWithLabel[];
		total: number;
	}>;
	isFavorite(bookmarkId: number): Promise<boolean>;
	findRecentlyRead(): Promise<BookmarkWithLabel[]>;

	/**
	 * 既読のブックマークを取得します。
	 * @returns 既読のブックマーク配列
	 */
	findRead(): Promise<BookmarkWithLabel[]>;

	/**
	 * ラベルが付与されていないブックマークを取得します。
	 * * 既読のブックマークは除外されます。
	 * @returns 未ラベルのブックマーク配列
	 */
	findUnlabeled(): Promise<Bookmark[]>;

	/**
	 * 指定されたラベル名に紐づくブックマークを取得します。
	 * @param labelName ラベル名（正規化済み）
	 * @returns ラベルに紐づくブックマーク配列（ラベル情報付き）
	 */ // Add newline after comment block
	findByLabelName(labelName: string): Promise<BookmarkWithLabel[]>;

	/**
	 * 指定されたIDのブックマークを取得します。
	 * @param id ブックマークID
	 * @returns ブックマークオブジェクト（ラベル・お気に入り情報付き）、存在しない場合はundefined
	 */
	findById(id: number): Promise<BookmarkWithLabel | undefined>;

	/**
	 * 指定されたIDのブックマークを一括で取得します。
	 * @param ids ブックマークIDの配列
	 * @returns ブックマークのマップ（ID => BookmarkWithLabel）
	 */
	findByIds(ids: number[]): Promise<Map<number, BookmarkWithLabel>>;

	/**
	 * 評価が存在しないブックマークを取得します。
	 * @returns 未評価のブックマーク配列
	 */
	findUnrated(): Promise<BookmarkWithLabel[]>;
}
