/**
 * カスタム例外の基底クラス
 * アプリケーション内で発生するすべてのカスタム例外はこのクラスを継承する
 */
export abstract class BaseError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean;

	constructor(message: string, statusCode: number, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;

		// エラー名をクラス名に設定
		this.name = this.constructor.name;

		// スタックトレースを正しく設定
		Error.captureStackTrace(this, this.constructor);
	}
}

/**
 * HTTPエラーレスポンスの基底クラス
 * HTTPステータスコードと関連付けられたエラー
 */
export abstract class HttpError extends BaseError {
	constructor(message: string, statusCode: number) {
		super(message, statusCode, true);
	}
}
