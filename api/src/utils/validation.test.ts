import { describe, expect, test } from "vitest";
import {
	validateId,
	validateIdArray,
	validateNumber,
	validateOptionalBoolean,
	validateOptionalNumber,
	validateOptionalString,
	validateRequestBody,
	validateRequiredString,
} from "./validation";

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
			expect(validateOptionalString(undefined, "description")).toBe(undefined);
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
