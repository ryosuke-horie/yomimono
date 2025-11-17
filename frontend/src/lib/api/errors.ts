/**
 * API通信エラーのカスタムエラークラスと関連ユーティリティ
 */

/**
 * API通信で発生するエラーを表すカスタムエラークラス
 */
export class ApiError extends Error {
	constructor(
		message: string,
		public code?: string,
		public details?: unknown,
	) {
		super(message);
		this.name = "ApiError";
		// Object.setPrototypeOfによりinstanceofが正しく動作するようにする
		Object.setPrototypeOf(this, ApiError.prototype);
	}
}

/**
 * HTTPステータスコードに基づくエラーコード
 */
export const API_ERROR_CODES = {
	NETWORK_ERROR: "NETWORK_ERROR",
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	NOT_FOUND: "NOT_FOUND",
	SERVER_ERROR: "SERVER_ERROR",
	BAD_REQUEST: "BAD_REQUEST",
	PARSE_ERROR: "PARSE_ERROR",
	UNKNOWN: "UNKNOWN",
} as const;

type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

/**
 * エラーメッセージのマッピング
 */
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
	[API_ERROR_CODES.NETWORK_ERROR]:
		"接続エラーが発生しました。ネットワークを確認してください。",
	[API_ERROR_CODES.UNAUTHORIZED]: "認証が必要です。ログインしてください。",
	[API_ERROR_CODES.FORBIDDEN]: "アクセス権限がありません。",
	[API_ERROR_CODES.NOT_FOUND]: "リソースが見つかりません。",
	[API_ERROR_CODES.SERVER_ERROR]:
		"サーバーエラーが発生しました。しばらく待ってから再試行してください。",
	[API_ERROR_CODES.BAD_REQUEST]:
		"リクエストが不正です。入力内容を確認してください。",
	[API_ERROR_CODES.PARSE_ERROR]: "データの処理中にエラーが発生しました。",
	[API_ERROR_CODES.UNKNOWN]: "予期しないエラーが発生しました。",
};

/**
 * HTTPステータスコードからエラーコードを取得
 */
function getErrorCodeFromStatus(status: number): ApiErrorCode {
	if (status === 401) return API_ERROR_CODES.UNAUTHORIZED;
	if (status === 403) return API_ERROR_CODES.FORBIDDEN;
	if (status === 404) return API_ERROR_CODES.NOT_FOUND;
	if (status >= 400 && status < 500) return API_ERROR_CODES.BAD_REQUEST;
	if (status >= 500) return API_ERROR_CODES.SERVER_ERROR;
	return API_ERROR_CODES.UNKNOWN;
}

/**
 * エラーオブジェクトからユーザー向けメッセージを取得
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		// ApiErrorの場合、コードに応じたメッセージを返す
		if (error.code && error.code in ERROR_MESSAGES) {
			return ERROR_MESSAGES[error.code as ApiErrorCode];
		}
		return error.message || ERROR_MESSAGES[API_ERROR_CODES.UNKNOWN];
	}

	if (error instanceof Error) {
		// ネットワークエラーなどの判定
		if (error.message.includes("fetch") || error.message.includes("network")) {
			return ERROR_MESSAGES[API_ERROR_CODES.NETWORK_ERROR];
		}
		return error.message;
	}

	return ERROR_MESSAGES[API_ERROR_CODES.UNKNOWN];
}

/**
 * fetchエラーをApiErrorに変換
 */
export function createApiError(
	response: Response | null,
	message?: string,
	details?: unknown,
): ApiError {
	if (!response) {
		return new ApiError(
			message || ERROR_MESSAGES[API_ERROR_CODES.NETWORK_ERROR],
			API_ERROR_CODES.NETWORK_ERROR,
			details,
		);
	}

	const code = getErrorCodeFromStatus(response.status);
	const errorMessage = message || ERROR_MESSAGES[code];

	return new ApiError(errorMessage, code, details);
}
