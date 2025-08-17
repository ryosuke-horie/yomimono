/**
 * 本棚機能に関するカスタムエラークラス
 */
import { BaseError, HttpError } from "./base";

export class BookshelfNotFoundError extends HttpError {
	constructor();
	constructor(id: number);
	constructor(id?: number) {
		const message =
			id === undefined
				? "Bookshelf not found"
				: `Bookshelf with id ${id} not found`;
		super(message, 404);
		this.name = "BookshelfNotFoundError";
	}
}

export class BookNotFoundError extends HttpError {
	constructor();
	constructor(bookId: number);
	constructor(bookshelfId: number, bookId: number);
	constructor(bookshelfIdOrBookId?: number, bookId?: number) {
		let message: string;
		if (bookshelfIdOrBookId === undefined && bookId === undefined) {
			// パラメータなし
			message = "Book not found";
		} else if (bookId === undefined) {
			// 単一パラメータ: bookId のみ
			message = `Book with id ${bookshelfIdOrBookId} not found`;
		} else {
			// 2つのパラメータ: bookshelfId と bookId
			message = `Book with id ${bookId} not found in bookshelf ${bookshelfIdOrBookId}`;
		}
		super(message, 404);
		this.name = "BookNotFoundError";
	}
}

export class InvalidBookshelfDataError extends HttpError {
	constructor(message: string) {
		super(message, 400);
		this.name = "InvalidBookshelfDataError";
	}
}

export class InvalidBookDataError extends HttpError {
	constructor(message: string) {
		super(message, 400);
		this.name = "InvalidBookDataError";
	}
}

export class BookshelfOperationError extends BaseError {
	constructor(message: string) {
		super(message, 500, true);
		this.name = "BookshelfOperationError";
	}
}

export class BookOperationError extends HttpError {
	constructor(operation: string) {
		super(`Book ${operation} failed: book not found`, 404);
		this.name = "BookOperationError";
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("BookshelfNotFoundError を正しく作成できる（ID指定）", () => {
		const error = new BookshelfNotFoundError(1);
		expect(error.message).toBe("Bookshelf with id 1 not found");
		expect(error.name).toBe("BookshelfNotFoundError");
		expect(error.statusCode).toBe(404);
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(HttpError);
	});

	test("BookshelfNotFoundError を正しく作成できる（ID不明）", () => {
		const error = new BookshelfNotFoundError();
		expect(error.message).toBe("Bookshelf not found");
		expect(error.name).toBe("BookshelfNotFoundError");
		expect(error.statusCode).toBe(404);
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(HttpError);
	});

	test("BookNotFoundError を正しく作成できる（ID不明）", () => {
		const error = new BookNotFoundError();
		expect(error.message).toBe("Book not found");
		expect(error.name).toBe("BookNotFoundError");
		expect(error.statusCode).toBe(404);
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(HttpError);
	});

	test("BookNotFoundError を正しく作成できる（単一ID）", () => {
		const error = new BookNotFoundError(2);
		expect(error.message).toBe("Book with id 2 not found");
		expect(error.name).toBe("BookNotFoundError");
		expect(error.statusCode).toBe(404);
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(HttpError);
	});

	test("BookNotFoundError を正しく作成できる（本棚IDと本ID）", () => {
		const error = new BookNotFoundError(1, 2);
		expect(error.message).toBe("Book with id 2 not found in bookshelf 1");
		expect(error.name).toBe("BookNotFoundError");
		expect(error.statusCode).toBe(404);
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(HttpError);
	});

	test("InvalidBookshelfDataError を正しく作成できる", () => {
		const error = new InvalidBookshelfDataError("Invalid name");
		expect(error.message).toBe("Invalid name");
		expect(error.name).toBe("InvalidBookshelfDataError");
		expect(error.statusCode).toBe(400);
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(HttpError);
	});

	test("InvalidBookDataError を正しく作成できる", () => {
		const error = new InvalidBookDataError("URL is required");
		expect(error.message).toBe("URL is required");
		expect(error.name).toBe("InvalidBookDataError");
		expect(error.statusCode).toBe(400);
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(HttpError);
	});

	test("BookshelfOperationError を正しく作成できる", () => {
		const error = new BookshelfOperationError("Database error");
		expect(error.message).toBe("Database error");
		expect(error.name).toBe("BookshelfOperationError");
		expect(error.statusCode).toBe(500);
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(BaseError);
	});

	test("BookOperationError を正しく作成できる", () => {
		const error = new BookOperationError("update");
		expect(error.message).toBe("Book update failed: book not found");
		expect(error.name).toBe("BookOperationError");
		expect(error.statusCode).toBe(404);
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(HttpError);
	});
}
