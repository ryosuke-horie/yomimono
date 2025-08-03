/**
 * 本棚機能のリポジトリ実装
 * Drizzle ORMを使用してD1データベースにアクセス
 */
import { eq, like } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { books } from "../db/schema";
import type { Book, BookStatusValue, BookTypeValue, InsertBook } from "../db/schema";
import type { IBookRepository } from "../interfaces/repository/book";

export class BookRepository implements IBookRepository {
	constructor(private db: DrizzleD1Database | any) {}

	/**
	 * 書籍を作成する
	 */
	async create(data: InsertBook): Promise<Book> {
		const [book] = await this.db
			.insert(books)
			.values(data)
			.returning();
		
		return book;
	}

	/**
	 * IDで書籍を取得する
	 */
	async findById(id: number): Promise<Book | null> {
		const [book] = await this.db
			.select()
			.from(books)
			.where(eq(books.id, id));
		
		return book ?? null;
	}

	/**
	 * すべての書籍を取得する
	 */
	async findAll(): Promise<Book[]> {
		return await this.db
			.select()
			.from(books);
	}

	/**
	 * ステータスで書籍を検索する
	 */
	async findByStatus(status: BookStatusValue): Promise<Book[]> {
		return await this.db
			.select()
			.from(books)
			.where(eq(books.status, status));
	}

	/**
	 * タイプで書籍を検索する
	 */
	async findByType(type: BookTypeValue): Promise<Book[]> {
		return await this.db
			.select()
			.from(books)
			.where(eq(books.type, type));
	}

	/**
	 * 書籍を更新する
	 */
	async update(id: number, data: Partial<InsertBook>): Promise<Book | null> {
		const [updated] = await this.db
			.update(books)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(books.id, id))
			.returning();
		
		return updated ?? null;
	}

	/**
	 * 書籍を削除する
	 */
	async delete(id: number): Promise<boolean> {
		const [deleted] = await this.db
			.delete(books)
			.where(eq(books.id, id))
			.returning();
		
		return !!deleted;
	}

	/**
	 * タイトルで書籍を検索する（部分一致）
	 */
	async searchByTitle(title: string): Promise<Book[]> {
		return await this.db
			.select()
			.from(books)
			.where(like(books.title, `%${title}%`));
	}

	/**
	 * 書籍のステータスを更新する
	 */
	async updateStatus(id: number, status: BookStatusValue): Promise<Book | null> {
		const [updated] = await this.db
			.update(books)
			.set({
				status,
				updatedAt: new Date(),
			})
			.where(eq(books.id, id))
			.returning();
		
		return updated ?? null;
	}

	/**
	 * 書籍を完了済みにマークする
	 */
	async markAsCompleted(id: number): Promise<Book | null> {
		const now = new Date();
		const [updated] = await this.db
			.update(books)
			.set({
				status: "completed",
				completedAt: now,
				updatedAt: now,
			})
			.where(eq(books.id, id))
			.returning();
		
		return updated ?? null;
	}
}