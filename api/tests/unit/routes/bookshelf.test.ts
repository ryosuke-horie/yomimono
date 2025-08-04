/**
 * 本棚機能APIエンドポイントの統合テスト
 */

import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Book } from "../../../src/db/schema/bookshelf";
import { BookStatus, BookType } from "../../../src/db/schema/bookshelf";
import {
	BookNotFoundError,
	InvalidBookDataError,
} from "../../../src/exceptions/bookshelf";
import { createBookshelfRouter } from "../../../src/routes/bookshelf";
import type { IBookshelfService } from "../../../src/services/BookshelfService";

// モックサービスの作成
const createMockService = (): IBookshelfService => ({
	getBooks: vi.fn(),
	getBook: vi.fn(),
	createBook: vi.fn(),
	updateBook: vi.fn(),
	updateBookStatus: vi.fn(),
	deleteBook: vi.fn(),
});

describe("本棚APIエンドポイント", () => {
	let mockService: IBookshelfService;
	let app: Hono;

	beforeEach(() => {
		mockService = createMockService();
		const router = createBookshelfRouter(mockService);
		app = new Hono();
		app.route("/api/bookshelf", router);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("GET /api/bookshelf", () => {
		test("全ての本を取得できる", async () => {
			const now = new Date();
			const mockBooks: Book[] = [
				{
					id: 1,
					title: "テスト本1",
					type: BookType.BOOK,
					status: BookStatus.UNREAD,
					url: null,
					imageUrl: null,
					completedAt: null,
					createdAt: now,
					updatedAt: now,
				},
				{
					id: 2,
					title: "テストPDF",
					type: BookType.PDF,
					status: BookStatus.READING,
					url: "https://example.com/test.pdf",
					imageUrl: null,
					completedAt: null,
					createdAt: now,
					updatedAt: now,
				},
			];

			vi.mocked(mockService.getBooks).mockResolvedValue(mockBooks);

			const response = await app.request("/api/bookshelf");
			const json = await response.json();

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.books).toEqual([
				{
					...mockBooks[0],
					createdAt: now.toISOString(),
					updatedAt: now.toISOString(),
				},
				{
					...mockBooks[1],
					createdAt: now.toISOString(),
					updatedAt: now.toISOString(),
				},
			]);
			expect(mockService.getBooks).toHaveBeenCalledWith(undefined);
		});

		test("ステータスでフィルタリングできる", async () => {
			const now = new Date();
			const mockBooks: Book[] = [
				{
					id: 1,
					title: "未読本",
					type: BookType.BOOK,
					status: BookStatus.UNREAD,
					url: null,
					imageUrl: null,
					completedAt: null,
					createdAt: now,
					updatedAt: now,
				},
			];

			vi.mocked(mockService.getBooks).mockResolvedValue(mockBooks);

			const response = await app.request("/api/bookshelf?status=unread");
			const json = await response.json();

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.books).toEqual([
				{
					...mockBooks[0],
					createdAt: now.toISOString(),
					updatedAt: now.toISOString(),
				},
			]);
			expect(mockService.getBooks).toHaveBeenCalledWith("unread");
		});

		test("無効なステータスの場合400エラーを返す", async () => {
			vi.mocked(mockService.getBooks).mockRejectedValue(
				new InvalidBookDataError("Invalid status: invalid"),
			);

			const response = await app.request("/api/bookshelf?status=invalid");
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json.success).toBe(false);
			expect(json.error).toBe("Invalid status: invalid");
		});
	});

	describe("GET /api/bookshelf/:id", () => {
		test("IDで本を取得できる", async () => {
			const now = new Date();
			const mockBook: Book = {
				id: 1,
				title: "テスト本",
				type: BookType.BOOK,
				status: BookStatus.UNREAD,
				url: null,
				imageUrl: null,
				completedAt: null,
				createdAt: now,
				updatedAt: now,
			};

			vi.mocked(mockService.getBook).mockResolvedValue(mockBook);

			const response = await app.request("/api/bookshelf/1");
			const json = await response.json();

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.book).toEqual({
				...mockBook,
				createdAt: now.toISOString(),
				updatedAt: now.toISOString(),
			});
			expect(mockService.getBook).toHaveBeenCalledWith(1);
		});

		test("存在しないIDの場合404エラーを返す", async () => {
			vi.mocked(mockService.getBook).mockRejectedValue(
				new BookNotFoundError(0, 999),
			);

			const response = await app.request("/api/bookshelf/999");
			const json = await response.json();

			expect(response.status).toBe(404);
			expect(json.success).toBe(false);
			expect(json.error).toBe("Book with id 999 not found in bookshelf 0");
		});

		test("無効なIDの場合400エラーを返す", async () => {
			const response = await app.request("/api/bookshelf/invalid");
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json.success).toBe(false);
			expect(json.error).toContain("Invalid ID");
		});
	});

	describe("POST /api/bookshelf", () => {
		test("新しい本を作成できる", async () => {
			const now = new Date();
			const inputData = {
				type: BookType.BOOK,
				title: "新しい本",
				url: null,
				imageUrl: null,
			};

			const createdBook: Book = {
				id: 1,
				...inputData,
				status: BookStatus.UNREAD,
				completedAt: null,
				createdAt: now,
				updatedAt: now,
			};

			vi.mocked(mockService.createBook).mockResolvedValue(createdBook);

			const response = await app.request("/api/bookshelf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(inputData),
			});
			const json = await response.json();

			expect(response.status).toBe(201);
			expect(json.success).toBe(true);
			expect(json.book).toEqual({
				...createdBook,
				createdAt: now.toISOString(),
				updatedAt: now.toISOString(),
			});
			expect(mockService.createBook).toHaveBeenCalledWith(inputData);
		});

		test("PDFタイプでURLがない場合400エラーを返す", async () => {
			const inputData = {
				type: BookType.PDF,
				title: "PDFドキュメント",
				url: null,
			};

			vi.mocked(mockService.createBook).mockRejectedValue(
				new InvalidBookDataError("URL is required for type: pdf"),
			);

			const response = await app.request("/api/bookshelf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(inputData),
			});
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json.success).toBe(false);
			expect(json.error).toBe("URL is required for type: pdf");
		});

		test("必須フィールドがない場合400エラーを返す", async () => {
			const response = await app.request("/api/bookshelf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type: BookType.BOOK }),
			});
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json.success).toBe(false);
			expect(json.error).toContain("title");
		});
	});

	describe("PUT /api/bookshelf/:id", () => {
		test("本の情報を更新できる", async () => {
			const now = new Date();
			const updateData = {
				title: "更新された本",
				type: BookType.GITHUB,
				url: "https://github.com/test/repo",
			};

			const updatedBook: Book = {
				id: 1,
				...updateData,
				imageUrl: null,
				status: BookStatus.READING,
				completedAt: null,
				createdAt: now,
				updatedAt: now,
			};

			vi.mocked(mockService.updateBook).mockResolvedValue(updatedBook);

			const response = await app.request("/api/bookshelf/1", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updateData),
			});
			const json = await response.json();

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.book).toEqual({
				...updatedBook,
				createdAt: now.toISOString(),
				updatedAt: now.toISOString(),
			});
			expect(mockService.updateBook).toHaveBeenCalledWith(1, updateData);
		});

		test("存在しない本を更新しようとすると404エラーを返す", async () => {
			vi.mocked(mockService.updateBook).mockRejectedValue(
				new BookNotFoundError(0, 999),
			);

			const response = await app.request("/api/bookshelf/999", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ title: "更新" }),
			});
			const json = await response.json();

			expect(response.status).toBe(404);
			expect(json.success).toBe(false);
			expect(json.error).toBe("Book with id 999 not found in bookshelf 0");
		});
	});

	describe("PATCH /api/bookshelf/:id/status", () => {
		test("本のステータスを更新できる", async () => {
			const now = new Date();
			const updatedBook: Book = {
				id: 1,
				title: "テスト本",
				type: BookType.BOOK,
				status: BookStatus.COMPLETED,
				url: null,
				imageUrl: null,
				completedAt: now,
				createdAt: now,
				updatedAt: now,
			};

			vi.mocked(mockService.updateBookStatus).mockResolvedValue(updatedBook);

			const response = await app.request("/api/bookshelf/1/status", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: BookStatus.COMPLETED }),
			});
			const json = await response.json();

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.book).toEqual({
				...updatedBook,
				completedAt: now.toISOString(),
				createdAt: now.toISOString(),
				updatedAt: now.toISOString(),
			});
			expect(mockService.updateBookStatus).toHaveBeenCalledWith(
				1,
				BookStatus.COMPLETED,
			);
		});

		test("無効なステータスの場合400エラーを返す", async () => {
			vi.mocked(mockService.updateBookStatus).mockRejectedValue(
				new InvalidBookDataError("Invalid status: invalid"),
			);

			const response = await app.request("/api/bookshelf/1/status", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: "invalid" }),
			});
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json.success).toBe(false);
			expect(json.error).toBe("Invalid status: invalid");
		});
	});

	describe("DELETE /api/bookshelf/:id", () => {
		test("本を削除できる", async () => {
			vi.mocked(mockService.deleteBook).mockResolvedValue(undefined);

			const response = await app.request("/api/bookshelf/1", {
				method: "DELETE",
			});
			const json = await response.json();

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.message).toBe("Book deleted successfully");
			expect(mockService.deleteBook).toHaveBeenCalledWith(1);
		});

		test("存在しない本を削除しようとすると404エラーを返す", async () => {
			vi.mocked(mockService.deleteBook).mockRejectedValue(
				new BookNotFoundError(0, 999),
			);

			const response = await app.request("/api/bookshelf/999", {
				method: "DELETE",
			});
			const json = await response.json();

			expect(response.status).toBe(404);
			expect(json.success).toBe(false);
			expect(json.error).toBe("Book with id 999 not found in bookshelf 0");
		});
	});
});
