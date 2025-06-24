/**
 * バリデーションユーティリティ関数群
 * 共通のバリデーションロジックを提供し、コード重複を解消
 */
import { BadRequestError } from "../exceptions";

/**
 * 文字列からIDを検証し、数値として返す
 */
export function validateId(value: string, fieldName = "ID"): number {
	const id = Number.parseInt(value);
	if (Number.isNaN(id)) {
		throw new BadRequestError(`Invalid ${fieldName}`);
	}
	return id;
}

/**
 * 必須文字列フィールドを検証
 */
export function validateRequiredString(
	value: unknown,
	fieldName: string,
): string {
	if (!value || typeof value !== "string" || value.trim() === "") {
		throw new BadRequestError(
			`${fieldName} is required and must be a non-empty string`,
		);
	}
	return value.trim();
}

/**
 * オプション文字列フィールドを検証
 */
export function validateOptionalString(
	value: unknown,
	fieldName: string,
): string | undefined {
	if (value === undefined || value === null) return undefined;
	if (typeof value !== "string") {
		throw new BadRequestError(`${fieldName} must be a string`);
	}
	return value;
}

/**
 * 配列内のIDを検証
 */
export function validateIdArray(
	values: unknown,
	fieldName = "articleIds",
): number[] {
	if (!Array.isArray(values) || values.length === 0) {
		throw new BadRequestError(
			`${fieldName} is required and must be a non-empty array`,
		);
	}

	return values.map((value, _index) => {
		const id = Number.parseInt(String(value));
		if (Number.isNaN(id)) {
			// Keep the original error message format for consistency
			let singularName = fieldName;
			if (fieldName === "articleIds") {
				singularName = "article";
			} else if (fieldName.endsWith("Ids")) {
				singularName = fieldName.slice(0, -3);
			} else if (fieldName.endsWith("s")) {
				singularName = fieldName.slice(0, -1);
			}
			throw new BadRequestError(`Invalid ${singularName} ID: ${value}`);
		}
		return id;
	});
}

/**
 * リクエストボディが存在するかを検証
 */
export function validateRequestBody<T>(body: unknown): T {
	if (!body || typeof body !== "object") {
		throw new BadRequestError("Invalid request body");
	}
	return body as T;
}

/**
 * 数値フィールドを検証（範囲チェック付き）
 */
export function validateNumber(
	value: unknown,
	fieldName: string,
	min?: number,
	max?: number,
): number {
	if (typeof value !== "number" || Number.isNaN(value)) {
		throw new BadRequestError(`${fieldName} must be a valid number`);
	}

	if (min !== undefined && value < min) {
		throw new BadRequestError(`${fieldName} must be at least ${min}`);
	}

	if (max !== undefined && value > max) {
		throw new BadRequestError(`${fieldName} must be at most ${max}`);
	}

	return value;
}

/**
 * オプション数値フィールドを検証（範囲チェック付き）
 */
export function validateOptionalNumber(
	value: unknown,
	fieldName: string,
	min?: number,
	max?: number,
): number | undefined {
	if (value === undefined || value === null) return undefined;
	return validateNumber(value, fieldName, min, max);
}

/**
 * オプションブール値フィールドを検証
 */
export function validateOptionalBoolean(
	value: unknown,
	fieldName: string,
): boolean | undefined {
	if (value === undefined || value === null) return undefined;

	if (typeof value !== "boolean") {
		throw new BadRequestError(`${fieldName} must be a boolean`);
	}

	return value;
}

if (import.meta.vitest) {
	const { test, expect, describe } = import.meta.vitest;

	describe("Validation Utils", () => {
		describe("validateId", () => {
			test("有効なIDを正しく変換する", () => {
				expect(validateId("123")).toBe(123);
				expect(validateId("1")).toBe(1);
			});

			test("無効なIDでエラーを投げる", () => {
				expect(() => validateId("invalid")).toThrow("Invalid ID");
				expect(() => validateId("")).toThrow("Invalid ID");
				expect(() => validateId("abc")).toThrow("Invalid ID");
			});

			test("カスタムフィールド名でエラーメッセージを生成する", () => {
				expect(() => validateId("invalid", "bookmark ID")).toThrow(
					"Invalid bookmark ID",
				);
			});
		});

		describe("validateRequiredString", () => {
			test("有効な文字列を正しく処理する", () => {
				expect(validateRequiredString("test", "name")).toBe("test");
				expect(validateRequiredString("  test  ", "name")).toBe("test");
			});

			test("無効な値でエラーを投げる", () => {
				expect(() => validateRequiredString("", "name")).toThrow(
					"name is required and must be a non-empty string",
				);
				expect(() => validateRequiredString("   ", "name")).toThrow(
					"name is required and must be a non-empty string",
				);
				expect(() => validateRequiredString(null, "name")).toThrow(
					"name is required and must be a non-empty string",
				);
				expect(() => validateRequiredString(123, "name")).toThrow(
					"name is required and must be a non-empty string",
				);
			});
		});

		describe("validateOptionalString", () => {
			test("有効な文字列を正しく処理する", () => {
				expect(validateOptionalString("test", "description")).toBe("test");
				expect(validateOptionalString(undefined, "description")).toBe(
					undefined,
				);
				expect(validateOptionalString(null, "description")).toBe(undefined);
			});

			test("無効な型でエラーを投げる", () => {
				expect(() => validateOptionalString(123, "description")).toThrow(
					"description must be a string",
				);
			});
		});

		describe("validateIdArray", () => {
			test("有効なID配列を正しく処理する", () => {
				expect(validateIdArray([1, 2, 3])).toEqual([1, 2, 3]);
				expect(validateIdArray(["1", "2", "3"])).toEqual([1, 2, 3]);
			});

			test("空配列でエラーを投げる", () => {
				expect(() => validateIdArray([])).toThrow(
					"articleIds is required and must be a non-empty array",
				);
			});

			test("無効なIDでエラーを投げる", () => {
				expect(() => validateIdArray([1, "invalid", 3])).toThrow(
					"Invalid article ID: invalid",
				);
			});

			test("カスタムフィールド名でエラーメッセージを生成する", () => {
				expect(() => validateIdArray([], "bookmarkIds")).toThrow(
					"bookmarkIds is required and must be a non-empty array",
				);
				expect(() => validateIdArray([1, "invalid", 3], "bookmarkIds")).toThrow(
					"Invalid bookmark ID: invalid",
				);
			});

			test("未サポートフィールド名の単数形変換テスト", () => {
				expect(() => validateIdArray([1, "invalid", 3], "testIds")).toThrow(
					"Invalid test ID: invalid",
				);
				expect(() => validateIdArray([1, null, 3], "items")).toThrow(
					"Invalid item ID: null",
				);
			});
		});

		describe("validateRequestBody", () => {
			test("有効なオブジェクトを正しく処理する", () => {
				const body = { name: "test" };
				expect(validateRequestBody(body)).toEqual(body);
			});

			test("無効なボディでエラーを投げる", () => {
				expect(() => validateRequestBody(null)).toThrow("Invalid request body");
				expect(() => validateRequestBody("string")).toThrow(
					"Invalid request body",
				);
			});
		});

		describe("validateNumber", () => {
			test("有効な数値を正しく処理する", () => {
				expect(validateNumber(123, "count")).toBe(123);
				expect(validateNumber(0, "count")).toBe(0);
				expect(validateNumber(-5, "count")).toBe(-5);
			});

			test("範囲チェックが正しく動作する", () => {
				expect(validateNumber(5, "count", 1, 10)).toBe(5);
				expect(() => validateNumber(0, "count", 1, 10)).toThrow(
					"count must be at least 1",
				);
				expect(() => validateNumber(15, "count", 1, 10)).toThrow(
					"count must be at most 10",
				);
			});

			test("無効な値でエラーを投げる", () => {
				expect(() => validateNumber("123", "count")).toThrow(
					"count must be a valid number",
				);
				expect(() => validateNumber(Number.NaN, "count")).toThrow(
					"count must be a valid number",
				);
			});
		});

		describe("validateOptionalNumber", () => {
			test("有効な数値を正しく処理する", () => {
				expect(validateOptionalNumber(123, "count")).toBe(123);
				expect(validateOptionalNumber(undefined, "count")).toBe(undefined);
				expect(validateOptionalNumber(null, "count")).toBe(undefined);
			});

			test("範囲チェックが正しく動作する", () => {
				expect(validateOptionalNumber(5, "count", 1, 10)).toBe(5);
				expect(() => validateOptionalNumber(0, "count", 1, 10)).toThrow(
					"count must be at least 1",
				);
			});
		});

		describe("validateOptionalBoolean", () => {
			test("有効なブール値を正しく処理する", () => {
				expect(validateOptionalBoolean(true, "flag")).toBe(true);
				expect(validateOptionalBoolean(false, "flag")).toBe(false);
				expect(validateOptionalBoolean(undefined, "flag")).toBe(undefined);
				expect(validateOptionalBoolean(null, "flag")).toBe(undefined);
			});

			test("無効な値でエラーを投げる", () => {
				expect(() => validateOptionalBoolean("true", "flag")).toThrow(
					"flag must be a boolean",
				);
				expect(() => validateOptionalBoolean(1, "flag")).toThrow(
					"flag must be a boolean",
				);
			});
		});
	});
}
