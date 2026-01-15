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
	 * 記事に紐づくラベルの紐付けを削除します。
	 * @param articleId 記事ID
	 */
	deleteByArticleId(articleId: number): Promise<void>;
}
