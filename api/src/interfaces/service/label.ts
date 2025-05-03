import type { Label } from "../../db/schema";

export interface ILabelService {
	/**
	 * 全てのラベルを取得します（記事数付き）。
	 * @returns ラベルの配列（記事数付き）
	 */
	getLabels(): Promise<(Label & { articleCount: number })[]>;

	/**
	 * 指定されたIDのラベルを取得します。
	 * @param id ラベルID
	 * @returns ラベルオブジェクト
	 * @throws Error ラベルが存在しない場合
	 */
	getLabelById(id: number): Promise<Label>;

	/**
	 * 指定された記事にラベルを付与します。
	 * ラベルが存在しない場合は新規作成します。
	 * ラベル名は正規化されます。
	 * @param articleId ラベルを付与する記事ID
	 * @param labelName ラベル名（正規化前でも可）
	 * @param description ラベルの説明文（オプション）
	 * @returns 付与または作成されたラベルオブジェクト
	 * @throws Error 記事が存在しない場合
	 * @throws Error 記事が既にラベリング済みの場合
	 */
	assignLabel(articleId: number, labelName: string, description?: string): Promise<Label>;

	/**
	 * 新しいラベルを作成します。
	 * ラベル名は正規化されます。
	 * @param name 作成するラベル名（正規化前でも可）
	 * @param description ラベルの説明文（オプション）
	 * @returns 作成されたラベルオブジェクト
	 * @throws Error 正規化後のラベル名が空の場合
	 * @throws Error 同じ名前（正規化後）のラベルが既に存在する場合
	 */
	createLabel(name: string, description?: string): Promise<Label>;

	/**
	 * 指定されたIDのラベルを削除します。
	 * 関連する記事のラベリングも削除されます（DBの外部キー制約により）。
	 * @param id 削除するラベルのID
	 * @throws Error ラベルが存在しない場合
	 */
	deleteLabel(id: number): Promise<void>;
	
	/**
	 * 指定されたIDのラベルの説明文を更新します。
	 * @param id 更新するラベルのID
	 * @param description 新しい説明文
	 * @returns 更新されたラベルオブジェクト
	 * @throws Error ラベルが存在しない場合
	 */
	updateLabelDescription(id: number, description: string | null): Promise<Label>;
}
