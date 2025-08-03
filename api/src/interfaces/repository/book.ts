/**
 * 本棚機能のリポジトリインターフェース
 * 書籍、PDF、GitHub、Zennなどのコンテンツのデータアクセスを抽象化
 */
import type {
	Book,
	BookStatusValue,
	BookTypeValue,
	InsertBook,
} from "../../db/schema";

export interface IBookRepository {
	/**
	 * 書籍を作成する
	 * @param data 作成する書籍データ
	 * @returns 作成された書籍
	 */
	create(data: InsertBook): Promise<Book>;

	/**
	 * IDで書籍を取得する
	 * @param id 書籍ID
	 * @returns 書籍データ（見つからない場合はnull）
	 */
	findById(id: number): Promise<Book | null>;

	/**
	 * すべての書籍を取得する
	 * @returns 書籍の配列
	 */
	findAll(): Promise<Book[]>;

	/**
	 * ステータスで書籍を検索する
	 * @param status 検索するステータス
	 * @returns 該当する書籍の配列
	 */
	findByStatus(status: BookStatusValue): Promise<Book[]>;

	/**
	 * タイプで書籍を検索する
	 * @param type 検索するタイプ
	 * @returns 該当する書籍の配列
	 */
	findByType(type: BookTypeValue): Promise<Book[]>;

	/**
	 * 書籍を更新する
	 * @param id 更新する書籍のID
	 * @param data 更新データ
	 * @returns 更新された書籍（見つからない場合はnull）
	 */
	update(id: number, data: Partial<InsertBook>): Promise<Book | null>;

	/**
	 * 書籍を削除する
	 * @param id 削除する書籍のID
	 * @returns 削除成功の可否
	 */
	delete(id: number): Promise<boolean>;

	/**
	 * タイトルで書籍を検索する（部分一致）
	 * @param title 検索するタイトル
	 * @returns 該当する書籍の配列
	 */
	searchByTitle(title: string): Promise<Book[]>;

	/**
	 * 書籍のステータスを更新する
	 * @param id 書籍ID
	 * @param status 新しいステータス
	 * @returns 更新された書籍（見つからない場合はnull）
	 */
	updateStatus(id: number, status: BookStatusValue): Promise<Book | null>;

	/**
	 * 書籍を完了済みにマークする
	 * @param id 書籍ID
	 * @returns 更新された書籍（見つからない場合はnull）
	 */
	markAsCompleted(id: number): Promise<Book | null>;
}
