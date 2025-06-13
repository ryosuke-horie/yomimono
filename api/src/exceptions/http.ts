/**
 * HTTPステータスコードに対応する具体的な例外クラス
 * アプリケーション内で発生する一般的なHTTPエラーを定義
 */
import { HttpError } from "./base";

/**
 * 400 Bad Request
 * リクエストの構文が正しくない、または理解できない場合
 */
export class BadRequestError extends HttpError {
	constructor(message = "Bad Request") {
		super(message, 400);
	}
}

/**
 * 401 Unauthorized
 * 認証が必要なリソースへのアクセス時に認証情報が無効または不足している場合
 */
export class UnauthorizedError extends HttpError {
	constructor(message = "Unauthorized") {
		super(message, 401);
	}
}

/**
 * 403 Forbidden
 * 認証は成功したが、リソースへのアクセス権限がない場合
 */
export class ForbiddenError extends HttpError {
	constructor(message = "Forbidden") {
		super(message, 403);
	}
}

/**
 * 404 Not Found
 * リクエストされたリソースが見つからない場合
 */
export class NotFoundError extends HttpError {
	constructor(message = "Not Found") {
		super(message, 404);
	}
}

/**
 * 409 Conflict
 * リクエストが現在のリソースの状態と競合する場合
 */
export class ConflictError extends HttpError {
	constructor(message = "Conflict") {
		super(message, 409);
	}
}

/**
 * 422 Unprocessable Entity
 * リクエストの形式は正しいが、検証エラーで処理できない場合
 */
export class ValidationError extends HttpError {
	constructor(message = "Validation Failed") {
		super(message, 422);
	}
}

/**
 * 500 Internal Server Error
 * サーバー内部でエラーが発生した場合
 */
export class InternalServerError extends HttpError {
	constructor(message = "Internal Server Error") {
		super(message, 500);
	}
}

/**
 * 503 Service Unavailable
 * サービスが一時的に利用できない場合
 */
export class ServiceUnavailableError extends HttpError {
	constructor(message = "Service Unavailable") {
		super(message, 503);
	}
}

if (import.meta.vitest) {
	const { test, expect } = import.meta.vitest;

	test("BadRequestError は400エラーを生成する", () => {
		const error = new BadRequestError();
		expect(error.statusCode).toBe(400);
		expect(error.message).toBe("Bad Request");

		const customError = new BadRequestError("Invalid input");
		expect(customError.message).toBe("Invalid input");
	});

	test("NotFoundError は404エラーを生成する", () => {
		const error = new NotFoundError();
		expect(error.statusCode).toBe(404);
		expect(error.message).toBe("Not Found");

		const customError = new NotFoundError("Bookmark not found");
		expect(customError.message).toBe("Bookmark not found");
	});

	test("ValidationError は422エラーを生成する", () => {
		const error = new ValidationError();
		expect(error.statusCode).toBe(422);
		expect(error.message).toBe("Validation Failed");

		const customError = new ValidationError("Title is required");
		expect(customError.message).toBe("Title is required");
	});

	test("InternalServerError は500エラーを生成する", () => {
		const error = new InternalServerError();
		expect(error.statusCode).toBe(500);
		expect(error.message).toBe("Internal Server Error");

		const customError = new InternalServerError("Database connection failed");
		expect(customError.message).toBe("Database connection failed");
	});

	test("UnauthorizedError は401エラーを生成する", () => {
		const error = new UnauthorizedError();
		expect(error.statusCode).toBe(401);
		expect(error.message).toBe("Unauthorized");

		const customError = new UnauthorizedError("Invalid token");
		expect(customError.message).toBe("Invalid token");
	});

	test("ForbiddenError は403エラーを生成する", () => {
		const error = new ForbiddenError();
		expect(error.statusCode).toBe(403);
		expect(error.message).toBe("Forbidden");

		const customError = new ForbiddenError("Access denied");
		expect(customError.message).toBe("Access denied");
	});

	test("ConflictError は409エラーを生成する", () => {
		const error = new ConflictError();
		expect(error.statusCode).toBe(409);
		expect(error.message).toBe("Conflict");
	});

	test("ServiceUnavailableError は503エラーを生成する", () => {
		const error = new ServiceUnavailableError();
		expect(error.statusCode).toBe(503);
		expect(error.message).toBe("Service Unavailable");
	});
}
