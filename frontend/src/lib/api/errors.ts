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

export type ApiErrorCode =
	(typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

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
export function getErrorCodeFromStatus(status: number): ApiErrorCode {
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

// Vitest unit tests
if (import.meta.vitest) {
	const { describe, test, expect } = import.meta.vitest;

	describe("ApiError", () => {
		test("正しくApiErrorインスタンスを生成する", () => {
			const error = new ApiError("Test error", "TEST_CODE", { detail: "test" });
			expect(error).toBeInstanceOf(ApiError);
			expect(error).toBeInstanceOf(Error);
			expect(error.message).toBe("Test error");
			expect(error.code).toBe("TEST_CODE");
			expect(error.details).toEqual({ detail: "test" });
			expect(error.name).toBe("ApiError");
		});
	});

	describe("getErrorCodeFromStatus", () => {
		test("401の場合UNAUTHORIZEDを返す", () => {
			expect(getErrorCodeFromStatus(401)).toBe(API_ERROR_CODES.UNAUTHORIZED);
		});

		test("403の場合FORBIDDENを返す", () => {
			expect(getErrorCodeFromStatus(403)).toBe(API_ERROR_CODES.FORBIDDEN);
		});

		test("404の場合NOT_FOUNDを返す", () => {
			expect(getErrorCodeFromStatus(404)).toBe(API_ERROR_CODES.NOT_FOUND);
		});

		test("400番台の場合BAD_REQUESTを返す", () => {
			expect(getErrorCodeFromStatus(400)).toBe(API_ERROR_CODES.BAD_REQUEST);
			expect(getErrorCodeFromStatus(422)).toBe(API_ERROR_CODES.BAD_REQUEST);
		});

		test("500番台の場合SERVER_ERRORを返す", () => {
			expect(getErrorCodeFromStatus(500)).toBe(API_ERROR_CODES.SERVER_ERROR);
			expect(getErrorCodeFromStatus(503)).toBe(API_ERROR_CODES.SERVER_ERROR);
		});

		test("その他の場合UNKNOWNを返す", () => {
			expect(getErrorCodeFromStatus(200)).toBe(API_ERROR_CODES.UNKNOWN);
			expect(getErrorCodeFromStatus(300)).toBe(API_ERROR_CODES.UNKNOWN);
		});
	});

	describe("getErrorMessage", () => {
		test("ApiErrorの場合、コードに応じたメッセージを返す", () => {
			const error = new ApiError(
				"Original message",
				API_ERROR_CODES.UNAUTHORIZED,
			);
			expect(getErrorMessage(error)).toBe(
				"認証が必要です。ログインしてください。",
			);
		});

		test("ApiErrorでコードがない場合、元のメッセージを返す", () => {
			const error = new ApiError("Custom error message");
			expect(getErrorMessage(error)).toBe("Custom error message");
		});

		test("通常のErrorでネットワークエラーの場合", () => {
			const error = new Error("Failed to fetch");
			expect(getErrorMessage(error)).toBe(
				"接続エラーが発生しました。ネットワークを確認してください。",
			);
		});

		test("通常のErrorの場合、元のメッセージを返す", () => {
			const error = new Error("Something went wrong");
			expect(getErrorMessage(error)).toBe("Something went wrong");
		});

		test("エラーオブジェクトでない場合、デフォルトメッセージを返す", () => {
			expect(getErrorMessage("string error")).toBe(
				"予期しないエラーが発生しました。",
			);
			expect(getErrorMessage(null)).toBe("予期しないエラーが発生しました。");
			expect(getErrorMessage(undefined)).toBe(
				"予期しないエラーが発生しました。",
			);
		});
	});

	describe("createApiError", () => {
		test("レスポンスがnullの場合、ネットワークエラーを生成", () => {
			const error = createApiError(null);
			expect(error.code).toBe(API_ERROR_CODES.NETWORK_ERROR);
			expect(error.message).toBe(
				"接続エラーが発生しました。ネットワークを確認してください。",
			);
		});

		test("レスポンスのステータスコードに応じたエラーを生成", () => {
			const response = { status: 404 } as Response;
			const error = createApiError(response);
			expect(error.code).toBe(API_ERROR_CODES.NOT_FOUND);
			expect(error.message).toBe("リソースが見つかりません。");
		});

		test("カスタムメッセージと詳細を設定できる", () => {
			const response = { status: 500 } as Response;
			const error = createApiError(response, "Custom message", {
				detail: "test",
			});
			expect(error.code).toBe(API_ERROR_CODES.SERVER_ERROR);
			expect(error.message).toBe("Custom message");
			expect(error.details).toEqual({ detail: "test" });
		});
	});
}

