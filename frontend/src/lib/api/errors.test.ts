import { describe, expect, test } from "vitest";

import {
	API_ERROR_CODES,
	ApiError,
	createApiError,
	getErrorMessage,
} from "./errors";

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
		expect(getErrorMessage(undefined)).toBe("予期しないエラーが発生しました。");
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

	test("代表的なステータスコードで適切なエラーコードを返す", () => {
		expect(createApiError({ status: 401 } as Response).code).toBe(
			API_ERROR_CODES.UNAUTHORIZED,
		);
		expect(createApiError({ status: 403 } as Response).code).toBe(
			API_ERROR_CODES.FORBIDDEN,
		);
		expect(createApiError({ status: 400 } as Response).code).toBe(
			API_ERROR_CODES.BAD_REQUEST,
		);
		expect(createApiError({ status: 422 } as Response).code).toBe(
			API_ERROR_CODES.BAD_REQUEST,
		);
		expect(createApiError({ status: 500 } as Response).code).toBe(
			API_ERROR_CODES.SERVER_ERROR,
		);
	});
});
