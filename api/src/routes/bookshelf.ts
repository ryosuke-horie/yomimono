/**
 * 本棚機能のAPIエンドポイント
 * 書籍、PDF、GitHub、Zennなどのコンテンツを管理
 */

import type { Context } from "hono";
import { Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { BookStatusValue, BookTypeValue } from "../db/schema/bookshelf";
import { BadRequestError } from "../exceptions";
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
 * エラー型からHTTPステータスコードを決定する
 * @param error エラーオブジェクト
 * @returns HTTPステータスコード
 */
function determineStatusCode(error: unknown): ContentfulStatusCode {
	if (
		error instanceof BookNotFoundError ||
		error instanceof BookshelfNotFoundError
	) {
		return 404;
	}
	if (
		error instanceof InvalidBookDataError ||
		error instanceof InvalidBookshelfDataError ||
		error instanceof BadRequestError
	) {
		return 400;
	}
	return 500;
}
