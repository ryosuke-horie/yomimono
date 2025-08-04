/**
 * 本棚機能に関するカスタムエラークラス
 */

export class BookshelfNotFoundError extends Error {
	constructor(id: number) {
		super(`Bookshelf with id ${id} not found`);
		this.name = "BookshelfNotFoundError";
	}
}

export class BookNotFoundError extends Error {
	constructor();
	constructor(id: number);
	constructor(bookshelfId: number, bookId: number);
	constructor(idOrBookshelfId?: number, bookId?: number) {
		if (idOrBookshelfId === undefined) {
			super("Book not found");
		} else if (bookId !== undefined) {
			super(`Book with id ${bookId} not found in bookshelf ${idOrBookshelfId}`);
		} else {
			super(`Book with id ${idOrBookshelfId} not found`);
		}
		this.name = "BookNotFoundError";
	}
}

export class InvalidBookshelfDataError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidBookshelfDataError";
	}
}

export class InvalidBookDataError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidBookDataError";
	}
}

export class BookshelfOperationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BookshelfOperationError";
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("BookshelfNotFoundError を正しく作成できる", () => {
		const error = new BookshelfNotFoundError(1);
		expect(error.message).toBe("Bookshelf with id 1 not found");
		expect(error.name).toBe("BookshelfNotFoundError");
		expect(error).toBeInstanceOf(Error);
	});

	test("BookNotFoundError を正しく作成できる（ID不明）", () => {
		const error = new BookNotFoundError();
		expect(error.message).toBe("Book not found");
		expect(error.name).toBe("BookNotFoundError");
		expect(error).toBeInstanceOf(Error);
	});

	test("BookNotFoundError を正しく作成できる（単一ID）", () => {
		const error = new BookNotFoundError(2);
		expect(error.message).toBe("Book with id 2 not found");
		expect(error.name).toBe("BookNotFoundError");
		expect(error).toBeInstanceOf(Error);
	});

	test("BookNotFoundError を正しく作成できる（本棚IDと本ID）", () => {
		const error = new BookNotFoundError(1, 2);
		expect(error.message).toBe("Book with id 2 not found in bookshelf 1");
		expect(error.name).toBe("BookNotFoundError");
		expect(error).toBeInstanceOf(Error);
	});

	test("InvalidBookshelfDataError を正しく作成できる", () => {
		const error = new InvalidBookshelfDataError("Invalid name");
		expect(error.message).toBe("Invalid name");
		expect(error.name).toBe("InvalidBookshelfDataError");
		expect(error).toBeInstanceOf(Error);
	});

	test("InvalidBookDataError を正しく作成できる", () => {
		const error = new InvalidBookDataError("URL is required");
		expect(error.message).toBe("URL is required");
		expect(error.name).toBe("InvalidBookDataError");
		expect(error).toBeInstanceOf(Error);
	});

	test("BookshelfOperationError を正しく作成できる", () => {
		const error = new BookshelfOperationError("Database error");
		expect(error.message).toBe("Database error");
		expect(error.name).toBe("BookshelfOperationError");
		expect(error).toBeInstanceOf(Error);
	});
}
