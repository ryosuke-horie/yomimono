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
