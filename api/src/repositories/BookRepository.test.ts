/**
 * BookRepositoryのテスト
 * TDD/BDDアプローチで本棚機能のリポジトリ層をテスト
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Book, InsertBook } from "../db/schema";
import { BookStatus, BookType } from "../db/schema";
import { NotFoundError } from "../exceptions/http";
import { BookRepository } from "./BookRepository";

describe("BookRepository", () => {
	let repository: BookRepository;
	let mockDb: {
		insert: ReturnType<typeof vi.fn>;
		values: ReturnType<typeof vi.fn>;
		returning: ReturnType<typeof vi.fn>;
		select: ReturnType<typeof vi.fn>;
		from: ReturnType<typeof vi.fn>;
		where: ReturnType<typeof vi.fn>;
		update: ReturnType<typeof vi.fn>;
		set: ReturnType<typeof vi.fn>;
		delete: ReturnType<typeof vi.fn>;
	};

	// テスト用のモックデータ
	const mockBook: Book = {
		id: 1,
		type: BookType.BOOK,
		title: "Clean Architecture",
		url: null,
		imageUrl: "https://example.com/cover.jpg",
		status: BookStatus.UNREAD,
		completedAt: null,
		createdAt: new Date("2025-01-01"),
		updatedAt: new Date("2025-01-01"),
	};

	const createMockBook = (overrides: Partial<Book> = {}): Book => ({
		...mockBook,
		...overrides,
	});

	beforeEach(() => {
		// Drizzle ORMのモック作成
		mockDb = {
			insert: vi.fn().mockReturnThis(),
			values: vi.fn().mockReturnThis(),
			returning: vi.fn().mockResolvedValue([mockBook]),
			select: vi.fn().mockReturnThis(),
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
			update: vi.fn().mockReturnThis(),
			set: vi.fn().mockReturnThis(),
			delete: vi.fn().mockReturnThis(),
		};

		repository = new BookRepository(mockDb as any);
	});

	describe("create", () => {
		it("新しい書籍を作成できる", async () => {
			// Arrange
			const newBook: InsertBook = {
				type: BookType.BOOK,
				title: "Clean Architecture",
				imageUrl: "https://example.com/cover.jpg",
				status: BookStatus.UNREAD,
			};

			// Act
			const result = await repository.create(newBook);

			// Assert
			expect(result).toEqual(mockBook);
			expect(mockDb.insert).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.values).toHaveBeenCalledWith(newBook);
			expect(mockDb.returning).toHaveBeenCalled();
		});

		it("URLを含むPDFを作成できる", async () => {
			// Arrange
			const pdfBook: InsertBook = {
				type: BookType.PDF,
				title: "Research Paper",
				url: "https://example.com/paper.pdf",
				status: BookStatus.UNREAD,
			};

			const expectedPdf = createMockBook({
				id: 2,
				type: BookType.PDF,
				title: "Research Paper",
				url: "https://example.com/paper.pdf",
				imageUrl: null,
			});

			mockDb.returning.mockResolvedValue([expectedPdf]);

			// Act
			const result = await repository.create(pdfBook);

			// Assert
			expect(result).toEqual(expectedPdf);
			expect(result.type).toBe(BookType.PDF);
			expect(result.url).toBe("https://example.com/paper.pdf");
		});
	});

	describe("findById", () => {
		it("IDで書籍を取得できる", async () => {
			// Arrange
			mockDb.where.mockReturnThis();
			mockDb.where.mockResolvedValue([mockBook]);

			// Act
			const result = await repository.findById(1);

			// Assert
			expect(result).toEqual(mockBook);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
		});

		it("存在しないIDの場合NotFoundErrorをスローする", async () => {
			// Arrange
			mockDb.where.mockResolvedValue([]);

			// Act & Assert
			await expect(repository.findById(999)).rejects.toThrow(NotFoundError);
			await expect(repository.findById(999)).rejects.toThrow(
				"Book with id 999 not found",
			);
		});
	});

	describe("findAll", () => {
		it("すべての書籍を取得できる", async () => {
			// Arrange
			const books = [
				mockBook,
				createMockBook({ id: 2, title: "Domain Driven Design" }),
				createMockBook({ id: 3, type: BookType.PDF, title: "Paper" }),
			];
			mockDb.from.mockResolvedValue(books);

			// Act
			const result = await repository.findAll();

			// Assert
			expect(result).toEqual(books);
			expect(result).toHaveLength(3);
			expect(mockDb.select).toHaveBeenCalled();
			expect(mockDb.from).toHaveBeenCalledWith(expect.anything());
		});

		it("書籍がない場合空配列を返す", async () => {
			// Arrange
			mockDb.from.mockResolvedValue([]);

			// Act
			const result = await repository.findAll();

			// Assert
			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});
	});

	describe("findByStatus", () => {
		it("ステータスで書籍を検索できる", async () => {
			// Arrange
			const unreadBooks = [
				mockBook,
				createMockBook({ id: 2, title: "Book 2" }),
			];
			mockDb.where.mockResolvedValue(unreadBooks);

			// Act
			const result = await repository.findByStatus(BookStatus.UNREAD);

			// Assert
			expect(result).toEqual(unreadBooks);
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
		});

		it("読書中の書籍を検索できる", async () => {
			// Arrange
			const readingBook = createMockBook({
				id: 2,
				status: BookStatus.READING,
			});
			mockDb.where.mockResolvedValue([readingBook]);

			// Act
			const result = await repository.findByStatus(BookStatus.READING);

			// Assert
			expect(result).toEqual([readingBook]);
			expect(result[0].status).toBe(BookStatus.READING);
		});

		it("完了済みの書籍を検索できる", async () => {
			// Arrange
			const completedBook = createMockBook({
				id: 3,
				status: BookStatus.COMPLETED,
				completedAt: new Date("2025-01-15"),
			});
			mockDb.where.mockResolvedValue([completedBook]);

			// Act
			const result = await repository.findByStatus(BookStatus.COMPLETED);

			// Assert
			expect(result).toEqual([completedBook]);
			expect(result[0].status).toBe(BookStatus.COMPLETED);
			expect(result[0].completedAt).toEqual(new Date("2025-01-15"));
		});
	});

	describe("findByType", () => {
		it("タイプで書籍を検索できる", async () => {
			// Arrange
			const githubRepos = [
				createMockBook({ id: 1, type: BookType.GITHUB, title: "Repo 1" }),
				createMockBook({ id: 2, type: BookType.GITHUB, title: "Repo 2" }),
			];
			mockDb.where.mockResolvedValue(githubRepos);

			// Act
			const result = await repository.findByType(BookType.GITHUB);

			// Assert
			expect(result).toEqual(githubRepos);
			expect(result.every((book) => book.type === BookType.GITHUB)).toBe(true);
		});

		it("Zenn記事を検索できる", async () => {
			// Arrange
			const zennArticles = [
				createMockBook({
					id: 1,
					type: BookType.ZENN,
					title: "TypeScript入門",
					url: "https://zenn.dev/example/articles/123",
				}),
			];
			mockDb.where.mockResolvedValue(zennArticles);

			// Act
			const result = await repository.findByType(BookType.ZENN);

			// Assert
			expect(result).toEqual(zennArticles);
			expect(result[0].type).toBe(BookType.ZENN);
			expect(result[0].url).toContain("zenn.dev");
		});
	});

	describe("update", () => {
		it("書籍を更新できる", async () => {
			// Arrange
			const updatedBook = createMockBook({
				title: "Updated Title",
				updatedAt: new Date("2025-01-20"),
			});
			mockDb.returning.mockResolvedValue([updatedBook]);

			// Act
			const result = await repository.update(1, { title: "Updated Title" });

			// Assert
			expect(result).toEqual(updatedBook);
			expect(result?.title).toBe("Updated Title");
			expect(mockDb.update).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "Updated Title",
					updatedAt: expect.any(Date),
				}),
			);
		});

		it("存在しないIDの場合nullを返す", async () => {
			// Arrange
			mockDb.returning.mockResolvedValue([]);

			// Act
			const result = await repository.update(999, { title: "New Title" });

			// Assert
			expect(result).toBeNull();
		});

		it("更新時にupdatedAtが自動更新される", async () => {
			// Arrange
			const now = new Date();
			const updatedBook = createMockBook({
				title: "Updated",
				updatedAt: now,
			});
			mockDb.returning.mockResolvedValue([updatedBook]);

			// Act
			await repository.update(1, { title: "Updated" });

			// Assert
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					updatedAt: expect.any(Date),
				}),
			);
		});
	});

	describe("delete", () => {
		it("書籍を削除できる", async () => {
			// Arrange
			mockDb.returning.mockResolvedValue([mockBook]);

			// Act
			const result = await repository.delete(1);

			// Assert
			expect(result).toBe(true);
			expect(mockDb.delete).toHaveBeenCalledWith(expect.anything());
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
		});

		it("存在しないIDの場合falseを返す", async () => {
			// Arrange
			mockDb.returning.mockResolvedValue([]);

			// Act
			const result = await repository.delete(999);

			// Assert
			expect(result).toBe(false);
		});
	});

	describe("searchByTitle", () => {
		it("タイトルで部分一致検索できる", async () => {
			// Arrange
			const searchResults = [
				createMockBook({ id: 1, title: "Clean Architecture" }),
				createMockBook({ id: 2, title: "Clean Code" }),
			];
			mockDb.where.mockResolvedValue(searchResults);

			// Act
			const result = await repository.searchByTitle("Clean");

			// Assert
			expect(result).toEqual(searchResults);
			expect(result).toHaveLength(2);
			expect(mockDb.where).toHaveBeenCalledWith(expect.anything());
		});

		it("大文字小文字を区別せずに検索できる", async () => {
			// Arrange
			const book = createMockBook({ title: "TypeScript Handbook" });
			mockDb.where.mockResolvedValue([book]);

			// Act
			const result = await repository.searchByTitle("typescript");

			// Assert
			expect(result).toEqual([book]);
		});

		it("該当がない場合空配列を返す", async () => {
			// Arrange
			mockDb.where.mockResolvedValue([]);

			// Act
			const result = await repository.searchByTitle("NotFound");

			// Assert
			expect(result).toEqual([]);
		});
	});

	describe("updateStatus", () => {
		it("ステータスを更新できる", async () => {
			// Arrange
			const updatedBook = createMockBook({
				status: BookStatus.READING,
				updatedAt: new Date(),
			});
			mockDb.returning.mockResolvedValue([updatedBook]);

			// Act
			const result = await repository.updateStatus(1, BookStatus.READING);

			// Assert
			expect(result).toEqual(updatedBook);
			expect(result?.status).toBe(BookStatus.READING);
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					status: BookStatus.READING,
					updatedAt: expect.any(Date),
				}),
			);
		});

		it("存在しないIDの場合nullを返す", async () => {
			// Arrange
			mockDb.returning.mockResolvedValue([]);

			// Act
			const result = await repository.updateStatus(999, BookStatus.READING);

			// Assert
			expect(result).toBeNull();
		});
	});

	describe("markAsCompleted", () => {
		it("書籍を完了済みにマークできる", async () => {
			// Arrange
			const completedDate = new Date();
			const completedBook = createMockBook({
				status: BookStatus.COMPLETED,
				completedAt: completedDate,
				updatedAt: completedDate,
			});
			mockDb.returning.mockResolvedValue([completedBook]);

			// Act
			const result = await repository.markAsCompleted(1);

			// Assert
			expect(result).toEqual(completedBook);
			expect(result?.status).toBe(BookStatus.COMPLETED);
			expect(result?.completedAt).toBeDefined();
			expect(mockDb.set).toHaveBeenCalledWith(
				expect.objectContaining({
					status: BookStatus.COMPLETED,
					completedAt: expect.any(Date),
					updatedAt: expect.any(Date),
				}),
			);
		});

		it("存在しないIDの場合nullを返す", async () => {
			// Arrange
			mockDb.returning.mockResolvedValue([]);

			// Act
			const result = await repository.markAsCompleted(999);

			// Assert
			expect(result).toBeNull();
		});

		it("既に完了済みの書籍でも更新される", async () => {
			// Arrange
			const oldDate = new Date("2025-01-01");
			const newDate = new Date();
			// 既に完了済みの書籍データ（未使用だが、仕様の確認用）
			// const _alreadyCompleted = createMockBook({
			// 	status: BookStatus.COMPLETED,
			// 	completedAt: oldDate,
			// });

			const updatedBook = createMockBook({
				status: BookStatus.COMPLETED,
				completedAt: newDate,
				updatedAt: newDate,
			});
			mockDb.returning.mockResolvedValue([updatedBook]);

			// Act
			const result = await repository.markAsCompleted(1);

			// Assert
			expect(result?.completedAt).toEqual(newDate);
			expect(result?.completedAt).not.toEqual(oldDate);
		});
	});
});
