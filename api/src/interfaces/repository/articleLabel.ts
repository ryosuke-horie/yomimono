import type { ArticleLabel, InsertArticleLabel } from "../../db/schema";

export interface IArticleLabelRepository {
	/**
	 * 指定された記事IDに紐づく記事ラベルを取得します。
	 * @param articleId 記事ID
	 * @returns 記事ラベルオブジェクト、存在しない場合はundefined
	 */
	findByArticleId(articleId: number): Promise<ArticleLabel | undefined>;

	/**
	 * 新しい記事ラベルの紐付けを作成します。
	 * @param data 記事ラベルデータ (articleId, labelId)
	 * @returns 作成された記事ラベルオブジェクト
	 */
	create(
		data: Pick<InsertArticleLabel, "articleId" | "labelId">,
	): Promise<ArticleLabel>;

	/**
	 * 複数の記事ラベルの紐付けを一括作成します。
	 * @param data 記事ラベルデータの配列
	 * @returns 作成された記事ラベルオブジェクトの配列
	 */
	createMany(
		data: Array<Pick<InsertArticleLabel, "articleId" | "labelId">>,
	): Promise<ArticleLabel[]>;

	/**
	 * 指定された記事IDのリストに対してラベルが付与されているかを一括で確認します。
	 * @param articleIds 記事IDの配列
	 * @returns 既にラベルが付与されている記事IDのSet
	 */
	findExistingArticleIds(articleIds: number[]): Promise<Set<number>>;
}
