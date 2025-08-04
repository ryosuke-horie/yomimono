/**
 * 本棚機能のAPIエンドポイント
 * 書籍、PDF、GitHub、Zennなどのコンテンツを管理
 */

import type { Context } from "hono";
import { Hono } from "hono";
import type { BookStatusValue, BookTypeValue } from "../db/schema/bookshelf";
import {
	BookNotFoundError,
	BookshelfNotFoundError,
	InvalidBookDataError,
	InvalidBookshelfDataError,
} from "../exceptions/bookshelf";
import type { IBookshelfService } from "../services/BookshelfService";

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
			return c.json({ success: false, error: message }, statusCode as any);
		}
	});

	// GET /api/bookshelf/:id - 詳細取得
	app.get("/:id", async (c) => {
		try {
			const id = validateId(c.req.param("id"));
			if (!id) {
				return c.json({ success: false, error: "Invalid ID" }, 400);
			}

			const book = await bookshelfService.getBook(id);
			return c.json({ success: true, book });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			const statusCode = determineStatusCode(error);
			return c.json({ success: false, error: message }, statusCode as any);
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
			return c.json({ success: false, error: message }, statusCode as any);
		}
	});

	// PUT /api/bookshelf/:id - 更新
	app.put("/:id", async (c) => {
		try {
			const id = validateId(c.req.param("id"));
			if (!id) {
				return c.json({ success: false, error: "Invalid ID" }, 400);
			}

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
			return c.json({ success: false, error: message }, statusCode as any);
		}
	});

	// PATCH /api/bookshelf/:id/status - ステータス更新
	app.patch("/:id/status", async (c) => {
		try {
			const id = validateId(c.req.param("id"));
			if (!id) {
				return c.json({ success: false, error: "Invalid ID" }, 400);
			}

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
			return c.json({ success: false, error: message }, statusCode as any);
		}
	});

	// DELETE /api/bookshelf/:id - 削除
	app.delete("/:id", async (c) => {
		try {
			const id = validateId(c.req.param("id"));
			if (!id) {
				return c.json({ success: false, error: "Invalid ID" }, 400);
			}

			await bookshelfService.deleteBook(id);
			return c.json({ success: true, message: "Book deleted successfully" });
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			const statusCode = determineStatusCode(error);
			return c.json({ success: false, error: message }, statusCode as any);
		}
	});

	return app;
};

/**
 * IDをバリデーションする
 * @param id ID文字列
 * @returns 有効な数値ID、無効な場合はnull
 */
function validateId(id: string): number | null {
	const numId = Number(id);
	if (Number.isNaN(numId) || numId <= 0) {
		return null;
	}
	return numId;
}

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
function determineStatusCode(error: unknown): number {
	if (
		error instanceof BookNotFoundError ||
		error instanceof BookshelfNotFoundError
	) {
		return 404;
	}
	if (
		error instanceof InvalidBookDataError ||
		error instanceof InvalidBookshelfDataError
	) {
		return 400;
	}
	return 500;
}
