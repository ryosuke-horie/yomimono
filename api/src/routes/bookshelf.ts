/**
 * 本棚機能のAPIエンドポイント
 * 書籍、PDF、GitHub、Zennなどのコンテンツを管理
 */

import type { Context } from "hono";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { BookStatusValue, BookTypeValue } from "../db/schema/bookshelf";
import { BadRequestError } from "../exceptions";
import { BaseError } from "../exceptions/base";
import {
	BookNotFoundError,
	BookshelfNotFoundError,
	InvalidBookDataError,
	InvalidBookshelfDataError,
} from "../exceptions/bookshelf";
import type { IBookshelfService } from "../services/BookshelfService";
import { validateId as validateIdUtil } from "../utils/validation";

/**
 * 本棚ルーターを作成する
 * @param bookshelfService 本棚サービス
 * @returns 本棚ルーター
 */
export const createBookshelfRouter = (bookshelfService: IBookshelfService) => {
	const app = new Hono();

	// GET /api/bookshelf - 一覧取得
	app.get("/", async (c) => {
		try {
			const status = c.req.query("status") as BookStatusValue | undefined;
			const books = await bookshelfService.getBooks(status);
			return c.json({ success: true, books });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			const statusCode = determineStatusCode(error);
			return c.json({ success: false, error: message }, statusCode);
		}
	});

	// GET /api/bookshelf/:id - 詳細取得
	app.get("/:id", async (c) => {
		try {
			const id = validateIdUtil(c.req.param("id"));
			const book = await bookshelfService.getBook(id);
			return c.json({ success: true, book });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			const statusCode = determineStatusCode(error);
			return c.json({ success: false, error: message }, statusCode);
		}
	});

	// POST /api/bookshelf - 新規作成
	app.post("/", async (c) => {
		try {
			const body = await parseRequestBody<{
				type: BookTypeValue;
				title: string;
				url?: string | null;
				imageUrl?: string | null;
			}>(c);

			if (!body) {
				return c.json({ success: false, error: "Invalid request body" }, 400);
			}

			if (!body.title) {
				return c.json({ success: false, error: "title is required" }, 400);
			}

			const book = await bookshelfService.createBook(body);
			return c.json({ success: true, book }, 201);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			const statusCode = determineStatusCode(error);
			return c.json({ success: false, error: message }, statusCode);
		}
	});

	// PUT /api/bookshelf/:id - 更新
	app.put("/:id", async (c) => {
		try {
			const id = validateIdUtil(c.req.param("id"));
			const body =
				await parseRequestBody<
					Partial<{
						type: BookTypeValue;
						title: string;
						url?: string | null;
						imageUrl?: string | null;
					}>
				>(c);
			if (!body) {
				return c.json({ success: false, error: "Invalid request body" }, 400);
			}

			const book = await bookshelfService.updateBook(id, body);
			return c.json({ success: true, book });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			const statusCode = determineStatusCode(error);
			return c.json({ success: false, error: message }, statusCode);
		}
	});

	// PATCH /api/bookshelf/:id/status - ステータス更新
	app.patch("/:id/status", async (c) => {
		try {
			const id = validateIdUtil(c.req.param("id"));
			const body = await parseRequestBody<{ status: BookStatusValue }>(c);
			if (!body) {
				return c.json({ success: false, error: "Invalid request body" }, 400);
			}

			if (!body.status) {
				return c.json({ success: false, error: "status is required" }, 400);
			}

			const book = await bookshelfService.updateBookStatus(id, body.status);
			return c.json({ success: true, book });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			const statusCode = determineStatusCode(error);
			return c.json({ success: false, error: message }, statusCode);
		}
	});

	// DELETE /api/bookshelf/:id - 削除
	app.delete("/:id", async (c) => {
		try {
			const id = validateIdUtil(c.req.param("id"));
			await bookshelfService.deleteBook(id);
			return c.json({ success: true, message: "Book deleted successfully" });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			const statusCode = determineStatusCode(error);
			return c.json({ success: false, error: message }, statusCode);
		}
	});

	return app;
};

/**
 * リクエストボディをパースする
 * @param c Honoコンテキスト
 * @returns パースされたボディ、失敗した場合はnull
 */
async function parseRequestBody<T = unknown>(c: Context): Promise<T | null> {
	try {
		return await c.req.json();
	} catch {
		return null;
	}
}

/**
 * ステータスコードが有効なContentfulStatusCodeかを判定する型ガード
 * @param code ステータスコード
 * @returns ContentfulStatusCodeとして有効な場合true
 */
function isValidStatusCode(code: number): code is ContentfulStatusCode {
	return [200, 201, 400, 404, 500].includes(code);
}

/**
 * エラー型からHTTPステータスコードを決定する
 * @param error エラーオブジェクト
 * @returns HTTPステータスコード
 */
function determineStatusCode(error: unknown): ContentfulStatusCode {
	if (error instanceof BaseError && isValidStatusCode(error.statusCode)) {
		return error.statusCode;
	}
	return 500;
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("determineStatusCode はBaseErrorインスタンスから正しいステータスコードを返す", () => {
		const notFoundError = new BookNotFoundError(1);
		expect(determineStatusCode(notFoundError)).toBe(404);

		const bookshelfNotFoundError = new BookshelfNotFoundError(1);
		expect(determineStatusCode(bookshelfNotFoundError)).toBe(404);

		const invalidDataError = new InvalidBookDataError("Invalid data");
		expect(determineStatusCode(invalidDataError)).toBe(400);

		const invalidBookshelfError = new InvalidBookshelfDataError("Invalid data");
		expect(determineStatusCode(invalidBookshelfError)).toBe(400);

		const badRequestError = new BadRequestError("Bad request");
		expect(determineStatusCode(badRequestError)).toBe(400);
	});

	test("determineStatusCode は非BaseErrorインスタンスに対して500を返す", () => {
		const plainError = new Error("Something went wrong");
		expect(determineStatusCode(plainError)).toBe(500);

		const stringError = "Error string";
		expect(determineStatusCode(stringError)).toBe(500);

		const unknownError = null;
		expect(determineStatusCode(unknownError)).toBe(500);
	});

	test("isValidStatusCode は有効なステータスコードを正しく判定する", () => {
		// 有効なステータスコード
		expect(isValidStatusCode(200)).toBe(true);
		expect(isValidStatusCode(201)).toBe(true);
		expect(isValidStatusCode(400)).toBe(true);
		expect(isValidStatusCode(404)).toBe(true);
		expect(isValidStatusCode(500)).toBe(true);

		// 無効なステータスコード
		expect(isValidStatusCode(302)).toBe(false);
		expect(isValidStatusCode(401)).toBe(false);
		expect(isValidStatusCode(403)).toBe(false);
		expect(isValidStatusCode(503)).toBe(false);
		expect(isValidStatusCode(999)).toBe(false);
	});

	test("determineStatusCode は不正なステータスコードを持つBaseErrorに対して500を返す", () => {
		// 不正なステータスコードを持つカスタムエラーを作成
		class CustomError extends BaseError {
			constructor(statusCode: number) {
				super("Custom error", statusCode, true);
			}
		}

		// 無効なステータスコードのテスト
		const invalidStatusError1 = new CustomError(302);
		expect(determineStatusCode(invalidStatusError1)).toBe(500);

		const invalidStatusError2 = new CustomError(401);
		expect(determineStatusCode(invalidStatusError2)).toBe(500);

		const invalidStatusError3 = new CustomError(999);
		expect(determineStatusCode(invalidStatusError3)).toBe(500);

		// 有効なステータスコードは正しく返される
		const validStatusError = new CustomError(404);
		expect(determineStatusCode(validStatusError)).toBe(404);
	});
}
