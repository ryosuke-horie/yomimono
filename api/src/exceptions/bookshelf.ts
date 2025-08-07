/**
 * 本棚機能に関するカスタムエラークラス
 */
import { BaseError, HttpError } from "./base";

export class BookshelfNotFoundError extends HttpError {
	constructor(id: number) {
		super(`Bookshelf with id ${id} not found`, 404);
		this.name = "BookshelfNotFoundError";
	}
}

export class BookNotFoundError extends HttpError {
	constructor();
	constructor(bookId: number);
	constructor(bookshelfId: number | null, bookId: number);
	constructor(bookshelfIdOrBookId?: number | null, bookId?: number) {
		let message: string;
		if (bookshelfIdOrBookId === undefined) {
			message = "Book not found";
		} else if (bookId !== undefined) {
			// bookshelfIdOrBookId is bookshelfId in this case
			if (bookshelfIdOrBookId === null) {
				message = `Book with id ${bookId} not found`;
			} else {
				message = `Book with id ${bookId} not found in bookshelf ${bookshelfIdOrBookId}`;
			}
		} else {
			// bookshelfIdOrBookId is bookId in this case
			message = `Book with id ${bookshelfIdOrBookId} not found`;
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

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("BookshelfNotFoundError を正しく作成できる", () => {
		const error = new BookshelfNotFoundError(1);
		expect(error.message).toBe("Bookshelf with id 1 not found");
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

	test("BookNotFoundError を正しく作成できる（本棚IDがnullの場合）", () => {
		const error = new BookNotFoundError(null, 2);
		expect(error.message).toBe("Book with id 2 not found");
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
}
