/**
 * 本棚機能のサービス層
 * ビジネスロジックとバリデーションを実装
 */

import type {
	Book,
	BookStatusValue,
	BookTypeValue,
	InsertBook,
} from "../db/schema/bookshelf";
import { BookStatus, BookType } from "../db/schema/bookshelf";
import type { IBookRepository } from "../interfaces/repository/book";

// エラーメッセージの定数化
const ERROR_MESSAGES = {
	BOOK_NOT_FOUND: "Book not found",
	TITLE_REQUIRED: "Title is required",
	TITLE_TOO_LONG: "Title must be 255 characters or less",
	INVALID_TYPE: (type: string) => `Invalid type: ${type}`,
	INVALID_STATUS: (status: string) => `Invalid status: ${status}`,
	URL_REQUIRED: (type: string) => `URL is required for type: ${type}`,
} as const;

// バリデーション定数
const VALIDATION_RULES = {
	TITLE_MAX_LENGTH: 255,
} as const;

// URL必須のタイプ定義
const URL_REQUIRED_TYPES = new Set<BookTypeValue>([
	BookType.PDF,
	BookType.GITHUB,
	BookType.ZENN,
]);

/**
 * タイトルのバリデーション結果
 */
type TitleValidationResult = {
	isValid: boolean;
	error?: string;
};

/**
 * 本棚サービスのインターフェース
 * テスト時にモック化しやすくするため
 */
export interface IBookshelfService {
	getBooks(status?: BookStatusValue): Promise<Book[]>;
	getBook(id: number): Promise<Book>;
	createBook(
		data: Omit<InsertBook, "status" | "createdAt" | "updatedAt">,
	): Promise<Book>;
	updateBook(id: number, data: Partial<InsertBook>): Promise<Book>;
	updateBookStatus(id: number, status: BookStatusValue): Promise<Book>;
	deleteBook(id: number): Promise<void>;
}

export class BookshelfService implements IBookshelfService {
	constructor(private readonly bookRepository: IBookRepository) {}

	/**
	 * 本の一覧を取得する
	 * @param status ステータスでフィルタリング（オプション）
	 * @returns 本の配列
	 */
	async getBooks(status?: BookStatusValue): Promise<Book[]> {
		if (status) {
			this.validateStatus(status);
			return this.bookRepository.findByStatus(status);
		}
		return this.bookRepository.findAll();
	}

	/**
	 * IDで本を取得する
	 * @param id 本のID
	 * @returns 本のデータ
	 */
	async getBook(id: number): Promise<Book> {
		const book = await this.bookRepository.findById(id);
		this.assertBookExists(book);
		return book;
	}

	/**
	 * 本を作成する
	 * @param data 作成する本のデータ
	 * @returns 作成された本
	 */
	async createBook(
		data: Omit<InsertBook, "status" | "createdAt" | "updatedAt">,
	): Promise<Book> {
		// バリデーション
		this.validateTitle(data.title);
		this.validateType(data.type);
		this.validateUrlRequirement(data.type, data.url);

		// デフォルトステータスを設定して作成
		const bookData = {
			...data,
			status: BookStatus.UNREAD,
		} satisfies InsertBook;

		return this.bookRepository.create(bookData);
	}

	/**
	 * 本を更新する
	 * @param id 更新する本のID
	 * @param data 更新データ
	 * @returns 更新された本
	 */
	async updateBook(id: number, data: Partial<InsertBook>): Promise<Book> {
		// 存在確認
		const existingBook = await this.bookRepository.findById(id);
		this.assertBookExists(existingBook);

		// 更新データのバリデーション
		if (data.title !== undefined) {
			this.validateTitle(data.title);
		}

		if (data.type !== undefined) {
			this.validateType(data.type);
		}

		if (data.status !== undefined) {
			this.validateStatus(data.status);
		}

		// タイプ変更時のURLチェック
		const newType = (data.type ?? existingBook.type) as BookTypeValue;
		const newUrl = data.url ?? existingBook.url;
		this.validateUrlRequirement(newType, newUrl);

		const updatedBook = await this.bookRepository.update(id, data);
		this.assertBookExists(updatedBook);
		return updatedBook;
	}

	/**
	 * 本のステータスを更新する
	 * @param id 本のID
	 * @param status 新しいステータス
	 * @returns 更新された本
	 */
	async updateBookStatus(id: number, status: BookStatusValue): Promise<Book> {
		this.validateStatus(status);

		// completedステータスの場合は専用メソッドを使用
		const book =
			status === BookStatus.COMPLETED
				? await this.bookRepository.markAsCompleted(id)
				: await this.bookRepository.updateStatus(id, status);

		this.assertBookExists(book);
		return book;
	}

	/**
	 * 本を削除する
	 * @param id 削除する本のID
	 */
	async deleteBook(id: number): Promise<void> {
		const success = await this.bookRepository.delete(id);
		if (!success) {
			throw new Error(ERROR_MESSAGES.BOOK_NOT_FOUND);
		}
	}

	// ========== バリデーションメソッド ==========

	/**
	 * タイトルのバリデーション
	 */
	private validateTitle(title: string | undefined | null): void {
		const result = this.checkTitleValidity(title);
		if (!result.isValid && result.error) {
			throw new Error(result.error);
		}
	}

	/**
	 * タイトルの妥当性をチェック
	 */
	private checkTitleValidity(
		title: string | undefined | null,
	): TitleValidationResult {
		if (!title || title.trim() === "") {
			return { isValid: false, error: ERROR_MESSAGES.TITLE_REQUIRED };
		}
		if (title.length > VALIDATION_RULES.TITLE_MAX_LENGTH) {
			return { isValid: false, error: ERROR_MESSAGES.TITLE_TOO_LONG };
		}
		return { isValid: true };
	}

	/**
	 * タイプのバリデーション
	 */
	private validateType(type: string): void {
		if (!this.isValidType(type)) {
			throw new Error(ERROR_MESSAGES.INVALID_TYPE(type));
		}
	}

	/**
	 * ステータスのバリデーション
	 */
	private validateStatus(status: string): void {
		if (!this.isValidStatus(status)) {
			throw new Error(ERROR_MESSAGES.INVALID_STATUS(status));
		}
	}

	/**
	 * URL必須チェック
	 */
	private validateUrlRequirement(
		type: string,
		url: string | undefined | null,
	): void {
		if (this.isValidType(type) && this.isUrlRequiredType(type) && !url) {
			throw new Error(ERROR_MESSAGES.URL_REQUIRED(type));
		}
	}

	/**
	 * 本の存在確認
	 */
	private assertBookExists(book: Book | null): asserts book is Book {
		if (!book) {
			throw new Error(ERROR_MESSAGES.BOOK_NOT_FOUND);
		}
	}

	/**
	 * 有効なタイプかチェックする
	 */
	private isValidType(type: string): type is BookTypeValue {
		const validTypes = Object.values(BookType) as readonly string[];
		return validTypes.includes(type);
	}

	/**
	 * 有効なステータスかチェックする
	 */
	private isValidStatus(status: string): status is BookStatusValue {
		const validStatuses = Object.values(BookStatus) as readonly string[];
		return validStatuses.includes(status);
	}

	/**
	 * URLが必須のタイプかチェックする
	 */
	private isUrlRequiredType(type: BookTypeValue): boolean {
		return URL_REQUIRED_TYPES.has(type);
	}

	// テスト用のヘルパーメソッド（テストでのみ使用）
	public _testHelpers = {
		isValidType: this.isValidType.bind(this),
		isValidStatus: this.isValidStatus.bind(this),
		isUrlRequiredType: this.isUrlRequiredType.bind(this),
	} as const;
}

if (import.meta.vitest) {
	const { test, expect, vi, describe, beforeEach } = import.meta.vitest;

	// モックリポジトリの作成
	const createMockRepository = (): IBookRepository => ({
		create: vi.fn(),
		findById: vi.fn(),
		findAll: vi.fn(),
		findByStatus: vi.fn(),
		findByType: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		searchByTitle: vi.fn(),
		updateStatus: vi.fn(),
		markAsCompleted: vi.fn(),
	});

	describe("BookshelfService", () => {
		let mockRepository: IBookRepository;
		let service: BookshelfService;

		beforeEach(() => {
			mockRepository = createMockRepository();
			service = new BookshelfService(mockRepository);
		});

		describe("内部バリデーションメソッド", () => {
			test("isValidTypeが正しいタイプを判定する", () => {
				// テスト用ヘルパーメソッドを使用（@ts-ignore不要）
				expect(service._testHelpers.isValidType("book")).toBe(true);
				expect(service._testHelpers.isValidType("pdf")).toBe(true);
				expect(service._testHelpers.isValidType("github")).toBe(true);
				expect(service._testHelpers.isValidType("zenn")).toBe(true);
				expect(service._testHelpers.isValidType("invalid")).toBe(false);
			});

			test("isValidStatusが正しいステータスを判定する", () => {
				expect(service._testHelpers.isValidStatus("unread")).toBe(true);
				expect(service._testHelpers.isValidStatus("reading")).toBe(true);
				expect(service._testHelpers.isValidStatus("completed")).toBe(true);
				expect(service._testHelpers.isValidStatus("invalid")).toBe(false);
			});

			test("isUrlRequiredTypeがURL必須タイプを正しく判定する", () => {
				expect(service._testHelpers.isUrlRequiredType("book")).toBe(false);
				expect(service._testHelpers.isUrlRequiredType("pdf")).toBe(true);
				expect(service._testHelpers.isUrlRequiredType("github")).toBe(true);
				expect(service._testHelpers.isUrlRequiredType("zenn")).toBe(true);
			});
		});

		describe("getBooks", () => {
			test("ステータス指定なしで全ての本を取得できる", async () => {
				const mockBooks: Book[] = [
					{
						id: 1,
						title: "テスト本",
						type: "book",
						status: "unread",
						url: null,
						imageUrl: null,
						completedAt: null,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				];
				vi.mocked(mockRepository.findAll).mockResolvedValue(mockBooks);

				const result = await service.getBooks();

				expect(result).toEqual(mockBooks);
				expect(mockRepository.findAll).toHaveBeenCalledOnce();
			});

			test("有効なステータスでフィルタリングできる", async () => {
				const mockBooks: Book[] = [
					{
						id: 1,
						title: "未読本",
						type: "book",
						status: "unread",
						url: null,
						imageUrl: null,
						completedAt: null,
						createdAt: new Date(),
						updatedAt: new Date(),
					},
				];
				vi.mocked(mockRepository.findByStatus).mockResolvedValue(mockBooks);

				const result = await service.getBooks("unread");

				expect(result).toEqual(mockBooks);
				expect(mockRepository.findByStatus).toHaveBeenCalledWith("unread");
			});

			test("無効なステータスを指定するとエラーになる", async () => {
				// @ts-expect-error - 無効なステータスを意図的に渡す
				await expect(service.getBooks("invalid")).rejects.toThrow(
					"Invalid status: invalid",
				);
			});
		});

		describe("createBook", () => {
			test("有効なデータで本を作成できる", async () => {
				const inputData = {
					title: "新しい本",
					type: "book" as BookTypeValue,
					url: null,
					imageUrl: null,
				};

				const createdBook: Book = {
					id: 1,
					...inputData,
					status: "unread",
					completedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				vi.mocked(mockRepository.create).mockResolvedValue(createdBook);

				const result = await service.createBook(inputData);

				expect(result).toEqual(createdBook);
				expect(mockRepository.create).toHaveBeenCalledWith({
					...inputData,
					status: "unread",
				});
			});

			test("タイトルが空の場合エラーになる", async () => {
				const inputData = {
					title: "",
					type: "book" as BookTypeValue,
					url: null,
					imageUrl: null,
				};

				await expect(service.createBook(inputData)).rejects.toThrow(
					"Title is required",
				);
			});

			test("タイトルが255文字を超える場合エラーになる", async () => {
				const inputData = {
					title: "a".repeat(256),
					type: "book" as BookTypeValue,
					url: null,
					imageUrl: null,
				};

				await expect(service.createBook(inputData)).rejects.toThrow(
					"Title must be 255 characters or less",
				);
			});

			test("PDF/GitHub/ZennタイプでURLがない場合エラーになる", async () => {
				const inputData = {
					title: "PDFドキュメント",
					type: "pdf" as BookTypeValue,
					url: null,
					imageUrl: null,
				};

				await expect(service.createBook(inputData)).rejects.toThrow(
					"URL is required for type: pdf",
				);
			});
		});

		describe("updateBookStatus", () => {
			test("完了ステータスの場合はmarkAsCompletedを使用する", async () => {
				const updatedBook: Book = {
					id: 1,
					title: "完了した本",
					type: "book",
					status: "completed",
					url: null,
					imageUrl: null,
					completedAt: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				vi.mocked(mockRepository.markAsCompleted).mockResolvedValue(
					updatedBook,
				);

				const result = await service.updateBookStatus(1, "completed");

				expect(result).toEqual(updatedBook);
				expect(mockRepository.markAsCompleted).toHaveBeenCalledWith(1);
				expect(mockRepository.updateStatus).not.toHaveBeenCalled();
			});

			test("完了以外のステータスの場合はupdateStatusを使用する", async () => {
				const updatedBook: Book = {
					id: 1,
					title: "読書中の本",
					type: "book",
					status: "reading",
					url: null,
					imageUrl: null,
					completedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				vi.mocked(mockRepository.updateStatus).mockResolvedValue(updatedBook);

				const result = await service.updateBookStatus(1, "reading");

				expect(result).toEqual(updatedBook);
				expect(mockRepository.updateStatus).toHaveBeenCalledWith(1, "reading");
				expect(mockRepository.markAsCompleted).not.toHaveBeenCalled();
			});
		});

		describe("deleteBook", () => {
			test("存在する本を削除できる", async () => {
				vi.mocked(mockRepository.delete).mockResolvedValue(true);

				await expect(service.deleteBook(1)).resolves.toBeUndefined();
				expect(mockRepository.delete).toHaveBeenCalledWith(1);
			});

			test("存在しない本を削除しようとするとエラーになる", async () => {
				vi.mocked(mockRepository.delete).mockResolvedValue(false);

				await expect(service.deleteBook(999)).rejects.toThrow("Book not found");
			});
		});
	});
}
