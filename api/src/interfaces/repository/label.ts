import type { InsertLabel, Label } from "../../db/schema";

export interface ILabelRepository {
	/**
	 * 全てのラベルを取得します。紐づく記事数もカウントします。
	 * @returns ラベルの配列（記事数付き）
	 */
	findAllWithArticleCount(): Promise<(Label & { articleCount: number })[]>;

	/**
	 * 指定された名前のラベルを取得します。
	 * @param name ラベル名（正規化済み）
	 * @returns ラベルオブジェクト、存在しない場合はundefined
	 */
	findByName(name: string): Promise<Label | undefined>;

	/**
	 * 指定されたIDのラベルを取得します。
	 * @param id ラベルID
	 * @returns ラベルオブジェクト、存在しない場合はundefined
	 */
	findById(id: number): Promise<Label | undefined>;

	/**
	 * 新しいラベルを作成します。
	 * @param data ラベルデータ（name, description）
	 * @returns 作成されたラベルオブジェクト
	 */
	create(data: Pick<InsertLabel, "name" | "description">): Promise<Label>;

	/**
	 * 指定されたIDのラベルを削除します。
	 * @param id 削除するラベルのID
	 * @returns データが削除された場合はtrue、存在しなかった場合はfalse
	 */
	deleteById(id: number): Promise<boolean>;

	/**
	 * 指定されたIDのラベルの説明文を更新します。
	 * @param id 更新するラベルのID
	 * @param description 新しい説明文
	 * @returns 更新されたラベルオブジェクト、存在しない場合はundefined
	 */
	updateDescription(
		id: number,
		description: string | null,
	): Promise<Label | undefined>;

	/**
	 * 指定されたIDsのラベルを一括削除します。
	 * @param ids 削除するラベルのID配列
	 * @returns 削除されたラベルの配列
	 */
	deleteMany(ids: number[]): Promise<Label[]>;
}
