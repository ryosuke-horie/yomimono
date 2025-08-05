/**
 * BookshelfServiceのユニットテスト
 * 本棚機能のビジネスロジックとバリデーションをテスト
 */
import { describe, expect, test, vi } from "vitest";
import type { Book, BookStatusValue, BookTypeValue } from "../db/schema";
import {
	BookNotFoundError,
	InvalidBookDataError,
} from "../exceptions/bookshelf";
import { NotFoundError } from "../exceptions/http";
import type { IBookRepository } from "../interfaces/repository/book";
import { BookshelfService } from "./BookshelfService";

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
	describe("getBooks", () => {
		test("ステータス指定なしで全ての本を取得できる", async () => {
			const mockRepository = createMockRepository();
			const mockBooks: Book[] = [
				{
					id: 1,
					type: "book",
					title: "テスト本1",
					url: null,
					imageUrl: null,
					status: "unread",
					completedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					type: "pdf",
					title: "テスト論文",
					url: "https://example.com/paper.pdf",
					imageUrl: null,
					status: "reading",
					completedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];
			mockRepository.findAll = vi.fn().mockResolvedValue(mockBooks);

			const service = new BookshelfService(mockRepository);
			const result = await service.getBooks();

			expect(result).toEqual(mockBooks);
			expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
		});

		test("ステータス指定で絞り込んだ本を取得できる", async () => {
			const mockRepository = createMockRepository();
			const mockBooks: Book[] = [
				{
					id: 1,
					type: "book",
					title: "未読の本",
					url: null,
					imageUrl: null,
					status: "unread",
					completedAt: null,
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];
			mockRepository.findByStatus = vi.fn().mockResolvedValue(mockBooks);

			const service = new BookshelfService(mockRepository);
			const result = await service.getBooks("unread");

			expect(result).toEqual(mockBooks);
			expect(mockRepository.findByStatus).toHaveBeenCalledWith("unread");
		});

		test("無効なステータスを指定した場合エラーが発生する", async () => {
			const mockRepository = createMockRepository();
			const service = new BookshelfService(mockRepository);

			await expect(
				service.getBooks("invalid" as BookStatusValue),
			).rejects.toThrow(InvalidBookDataError);
		});
	});

	describe("getBook", () => {
		test("IDで本を取得できる", async () => {
			const mockRepository = createMockRepository();
			const mockBook: Book = {
				id: 1,
				type: "book",
				title: "テスト本",
				url: null,
				imageUrl: null,
				status: "unread",
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockRepository.findById = vi.fn().mockResolvedValue(mockBook);

			const service = new BookshelfService(mockRepository);
			const result = await service.getBook(1);

			expect(result).toEqual(mockBook);
			expect(mockRepository.findById).toHaveBeenCalledWith(1);
		});

		test("存在しないIDを指定した場合エラーが発生する", async () => {
			const mockRepository = createMockRepository();
			mockRepository.findById = vi
				.fn()
				.mockRejectedValue(new NotFoundError("ID 999 の書籍が見つかりません"));

			const service = new BookshelfService(mockRepository);

			await expect(service.getBook(999)).rejects.toThrow(BookNotFoundError);
		});
	});

	describe("createBook", () => {
		test("有効なデータで本を作成できる", async () => {
			const mockRepository = createMockRepository();
			const mockBook: Book = {
				id: 1,
				type: "book",
				title: "新しい本",
				url: null,
				imageUrl: "https://example.com/cover.jpg",
				status: "unread",
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockRepository.create = vi.fn().mockResolvedValue(mockBook);

			const service = new BookshelfService(mockRepository);
			const result = await service.createBook({
				type: "book",
				title: "新しい本",
				imageUrl: "https://example.com/cover.jpg",
			});

			expect(result).toEqual(mockBook);
			expect(mockRepository.create).toHaveBeenCalledWith({
				type: "book",
				title: "新しい本",
				imageUrl: "https://example.com/cover.jpg",
				status: "unread",
			});
		});

		test("タイトルが空の場合エラーが発生する", async () => {
			const mockRepository = createMockRepository();
			const service = new BookshelfService(mockRepository);

			await expect(
				service.createBook({
					type: "book",
					title: "",
				}),
			).rejects.toThrow("Title is required");
		});

		test("タイトルが255文字を超える場合エラーが発生する", async () => {
			const mockRepository = createMockRepository();
			const service = new BookshelfService(mockRepository);

			await expect(
				service.createBook({
					type: "book",
					title: "a".repeat(256),
				}),
			).rejects.toThrow("Title must be 255 characters or less");
		});

		test("無効なタイプを指定した場合エラーが発生する", async () => {
			const mockRepository = createMockRepository();
			const service = new BookshelfService(mockRepository);

			await expect(
				service.createBook({
					type: "invalid" as BookTypeValue,
					title: "テスト",
				}),
			).rejects.toThrow("Invalid type: invalid");
		});

		test("PDF/GitHub/Zennの場合URLが必須", async () => {
			const mockRepository = createMockRepository();
			const service = new BookshelfService(mockRepository);

			await expect(
				service.createBook({
					type: "pdf",
					title: "論文",
				}),
			).rejects.toThrow("URL is required for type: pdf");

			await expect(
				service.createBook({
					type: "github",
					title: "リポジトリ",
				}),
			).rejects.toThrow("URL is required for type: github");

			await expect(
				service.createBook({
					type: "zenn",
					title: "Zenn本",
				}),
			).rejects.toThrow("URL is required for type: zenn");
		});
	});

	describe("updateBook", () => {
		test("有効なデータで本を更新できる", async () => {
			const mockRepository = createMockRepository();
			const mockBook: Book = {
				id: 1,
				type: "book",
				title: "更新された本",
				url: null,
				imageUrl: "https://example.com/new-cover.jpg",
				status: "reading",
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockRepository.findById = vi.fn().mockResolvedValue({
				id: 1,
				type: "book",
				title: "古い本",
				url: null,
				imageUrl: null,
				status: "unread",
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			mockRepository.update = vi.fn().mockResolvedValue(mockBook);

			const service = new BookshelfService(mockRepository);
			const result = await service.updateBook(1, {
				title: "更新された本",
				imageUrl: "https://example.com/new-cover.jpg",
				status: "reading",
			});

			expect(result).toEqual(mockBook);
			expect(mockRepository.update).toHaveBeenCalledWith(1, {
				title: "更新された本",
				imageUrl: "https://example.com/new-cover.jpg",
				status: "reading",
			});
		});

		test("存在しない本を更新しようとした場合エラーが発生する", async () => {
			const mockRepository = createMockRepository();
			mockRepository.findById = vi
				.fn()
				.mockRejectedValue(new NotFoundError("ID 999 の書籍が見つかりません"));

			const service = new BookshelfService(mockRepository);

			await expect(service.updateBook(999, { title: "更新" })).rejects.toThrow(
				BookNotFoundError,
			);
		});

		test("タイプ変更時のURL必須チェック", async () => {
			const mockRepository = createMockRepository();
			mockRepository.findById = vi.fn().mockResolvedValue({
				id: 1,
				type: "book",
				title: "本",
				url: null,
				imageUrl: null,
				status: "unread",
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const service = new BookshelfService(mockRepository);

			await expect(service.updateBook(1, { type: "pdf" })).rejects.toThrow(
				"URL is required for type: pdf",
			);
		});
	});

	describe("updateBookStatus", () => {
		test("本のステータスを更新できる", async () => {
			const mockRepository = createMockRepository();
			const mockBook: Book = {
				id: 1,
				type: "book",
				title: "テスト本",
				url: null,
				imageUrl: null,
				status: "reading",
				completedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			mockRepository.updateStatus = vi.fn().mockResolvedValue(mockBook);

			const service = new BookshelfService(mockRepository);
			const result = await service.updateBookStatus(1, "reading");

			expect(result).toEqual(mockBook);
			expect(mockRepository.updateStatus).toHaveBeenCalledWith(1, "reading");
		});

		test("completedステータスに更新した場合completedAtが設定される", async () => {
			const mockRepository = createMockRepository();
			const now = new Date();
			const mockBook: Book = {
				id: 1,
				type: "book",
				title: "テスト本",
				url: null,
				imageUrl: null,
				status: "completed",
				completedAt: now,
				createdAt: new Date(),
				updatedAt: now,
			};
			mockRepository.markAsCompleted = vi.fn().mockResolvedValue(mockBook);

			const service = new BookshelfService(mockRepository);
			const result = await service.updateBookStatus(1, "completed");

			expect(result).toEqual(mockBook);
			expect(mockRepository.markAsCompleted).toHaveBeenCalledWith(1);
		});

		test("無効なステータスを指定した場合エラーが発生する", async () => {
			const mockRepository = createMockRepository();
			const service = new BookshelfService(mockRepository);

			await expect(
				service.updateBookStatus(1, "invalid" as BookStatusValue),
			).rejects.toThrow("Invalid status: invalid");
		});

		test("存在しない本のステータスを更新しようとした場合エラーが発生する", async () => {
			const mockRepository = createMockRepository();
			mockRepository.updateStatus = vi.fn().mockResolvedValue(null);

			const service = new BookshelfService(mockRepository);

			await expect(service.updateBookStatus(999, "reading")).rejects.toThrow(
				BookNotFoundError,
			);
		});
	});

	describe("deleteBook", () => {
		test("本を削除できる", async () => {
			const mockRepository = createMockRepository();
			mockRepository.delete = vi.fn().mockResolvedValue(true);

			const service = new BookshelfService(mockRepository);
			await service.deleteBook(1);

			expect(mockRepository.delete).toHaveBeenCalledWith(1);
		});

		test("存在しない本を削除しようとした場合エラーが発生する", async () => {
			const mockRepository = createMockRepository();
			mockRepository.delete = vi.fn().mockResolvedValue(false);

			const service = new BookshelfService(mockRepository);

			await expect(service.deleteBook(999)).rejects.toThrow(BookNotFoundError);
		});
	});
});
