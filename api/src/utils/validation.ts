/**
 * バリデーションユーティリティ関数群
 * 共通のバリデーションロジックを提供し、コード重複を解消
 */
import { BadRequestError } from "../exceptions";

/**
 * 文字列からIDを検証し、数値として返す
 */
export function validateId(value: string, fieldName = "ID"): number {
	const id = Number.parseInt(value, 10);
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
		const id = Number.parseInt(String(value), 10);
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
