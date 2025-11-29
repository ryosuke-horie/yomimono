import { describe, expect, it } from "vitest";
import { HttpError } from "./base";
import {
	BadRequestError,
	ConflictError,
	InternalServerError,
	NotFoundError,
	ValidationError,
} from "./http";

type HttpErrorConstructor = new (message?: string) => HttpError;

const httpErrorCases: Array<{
	name: string;
	ErrorClass: HttpErrorConstructor;
	statusCode: number;
	defaultMessage: string;
}> = [
	{
		name: "BadRequestError",
		ErrorClass: BadRequestError,
		statusCode: 400,
		defaultMessage: "Bad Request",
	},
	{
		name: "NotFoundError",
		ErrorClass: NotFoundError,
		statusCode: 404,
		defaultMessage: "Not Found",
	},
	{
		name: "ConflictError",
		ErrorClass: ConflictError,
		statusCode: 409,
		defaultMessage: "Conflict",
	},
	{
		name: "ValidationError",
		ErrorClass: ValidationError,
		statusCode: 422,
		defaultMessage: "Validation Failed",
	},
	{
		name: "InternalServerError",
		ErrorClass: InternalServerError,
		statusCode: 500,
		defaultMessage: "Internal Server Error",
	},
];

describe("HTTP例外クラス", () => {
	it.each(httpErrorCases)(
		"%s は HttpError を継承しデフォルト値を持つ",
		({ ErrorClass, statusCode, defaultMessage }) => {
			const error = new ErrorClass();

			expect(error).toBeInstanceOf(HttpError);
			expect(error.statusCode).toBe(statusCode);
			expect(error.message).toBe(defaultMessage);
		},
	);

	it.each(httpErrorCases)(
		"%s はカスタムメッセージを受け取れる",
		({ ErrorClass }) => {
			const customMessage = "custom error message";
			const error = new ErrorClass(customMessage);

			expect(error.message).toBe(customMessage);
		},
	);
});
