import "server-only";

import type { ErrorResponse } from "@/lib/openapi/server/schemas";

export const BFF_ERROR_CODES = {
	BAD_REQUEST: "BAD_REQUEST",
	UNAUTHORIZED: "UNAUTHORIZED",
	FORBIDDEN: "FORBIDDEN",
	NOT_FOUND: "NOT_FOUND",
	CONFLICT: "CONFLICT",
	RATE_LIMITED: "RATE_LIMITED",
	INVALID_RESPONSE: "INVALID_RESPONSE",
	UPSTREAM_ERROR: "UPSTREAM_ERROR",
	UNKNOWN: "UNKNOWN",
} as const;

export type BffErrorCode =
	(typeof BFF_ERROR_CODES)[keyof typeof BFF_ERROR_CODES];

const ERROR_MESSAGES: Record<BffErrorCode, string> = {
	[BFF_ERROR_CODES.BAD_REQUEST]: "リクエスト内容が不正です。",
	[BFF_ERROR_CODES.UNAUTHORIZED]: "認証情報が必要です。",
	[BFF_ERROR_CODES.FORBIDDEN]: "アクセス権限がありません。",
	[BFF_ERROR_CODES.NOT_FOUND]: "リソースが見つかりません。",
	[BFF_ERROR_CODES.CONFLICT]: "既に存在するデータが原因で処理できません。",
	[BFF_ERROR_CODES.RATE_LIMITED]: "リクエストの上限に達しました。",
	[BFF_ERROR_CODES.INVALID_RESPONSE]:
		"上流APIのレスポンスを解析できませんでした。",
	[BFF_ERROR_CODES.UPSTREAM_ERROR]:
		"外部APIでエラーが発生しました。時間をおいて再試行してください。",
	[BFF_ERROR_CODES.UNKNOWN]: "予期しないエラーが発生しました。",
};

export class BffError extends Error {
	constructor(
		message: string,
		public status: number,
		public code: BffErrorCode,
		public cause?: unknown,
	) {
		super(message);
		this.name = "BffError";
		Object.setPrototypeOf(this, BffError.prototype);
	}
}

export function normalizeStatusCode(status?: number): number {
	if (status === undefined || Number.isNaN(status)) {
		return 502;
	}

	if (status < 200 || status > 599) {
		return 502;
	}

	return status;
}

export function mapStatusToErrorCode(status: number): BffErrorCode {
	const normalized = normalizeStatusCode(status);

	if (normalized === 400 || normalized === 422)
		return BFF_ERROR_CODES.BAD_REQUEST;
	if (normalized === 401) return BFF_ERROR_CODES.UNAUTHORIZED;
	if (normalized === 403) return BFF_ERROR_CODES.FORBIDDEN;
	if (normalized === 404) return BFF_ERROR_CODES.NOT_FOUND;
	if (normalized === 409) return BFF_ERROR_CODES.CONFLICT;
	if (normalized === 429) return BFF_ERROR_CODES.RATE_LIMITED;
	if (normalized >= 500) return BFF_ERROR_CODES.UPSTREAM_ERROR;

	return BFF_ERROR_CODES.UNKNOWN;
}

interface NormalizeErrorParams {
	status: number;
	body?: Partial<ErrorResponse> | null;
	cause?: unknown;
	messageOverride?: string;
}

export function normalizeUpstreamError({
	status,
	body,
	cause,
	messageOverride,
}: NormalizeErrorParams): BffError {
	const normalizedStatus = normalizeStatusCode(status);
	const code = mapStatusToErrorCode(normalizedStatus);
	const message = messageOverride ?? body?.message ?? ERROR_MESSAGES[code];

	return new BffError(message, normalizedStatus, code, body ?? cause);
}

export function createInvalidResponseError(
	status: number,
	cause?: unknown,
): BffError {
	const normalizedStatus = normalizeStatusCode(status);
	return new BffError(
		ERROR_MESSAGES[BFF_ERROR_CODES.INVALID_RESPONSE],
		normalizedStatus,
		BFF_ERROR_CODES.INVALID_RESPONSE,
		cause,
	);
}

export function toErrorResponseBody(error: unknown): {
	body: { success: false; message: string; code: BffErrorCode };
	status: number;
} {
	if (error instanceof BffError) {
		return {
			body: {
				success: false,
				message: error.message,
				code: error.code,
			},
			status: normalizeStatusCode(error.status),
		};
	}

	if (error instanceof Error) {
		return {
			body: {
				success: false,
				message: error.message,
				code: BFF_ERROR_CODES.UNKNOWN,
			},
			status: 500,
		};
	}

	return {
		body: {
			success: false,
			message: ERROR_MESSAGES[BFF_ERROR_CODES.UNKNOWN],
			code: BFF_ERROR_CODES.UNKNOWN,
		},
		status: 500,
	};
}

export function getErrorMessage(code: BffErrorCode): string {
	return ERROR_MESSAGES[code];
}
