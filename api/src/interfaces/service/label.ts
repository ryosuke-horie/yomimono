import type { Label } from "../../db/schema";

export interface ILabelService {
	/**
	 * 全てのラベルを取得します（記事数付き）。
	 * @returns ラベルの配列（記事数付き）
	 */
	getLabels(): Promise<(Label & { articleCount: number })[]>;

	/**
	 * 指定された記事にラベルを付与します。
	 * ラベルが存在しない場合は新規作成します。
	 * ラベル名は正規化されます。
	 * @param articleId ラベルを付与する記事ID
	 * @param labelName ラベル名（正規化前でも可）
	 * @returns 付与または作成されたラベルオブジェクト
	 * @throws Error 記事が存在しない場合
	 * @throws Error 記事が既にラベリング済みの場合
	 */
	assignLabel(articleId: number, labelName: string): Promise<Label>;

	/**
	 * 新しいラベルを作成します。
	 * ラベル名は正規化されます。
	 * @param name 作成するラベル名（正規化前でも可）
	 * @returns 作成されたラベルオブジェクト
	 * @throws Error 正規化後のラベル名が空の場合
	 * @throws Error 同じ名前（正規化後）のラベルが既に存在する場合
	 */
	createLabel(name: string): Promise<Label>;
}
