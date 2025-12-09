import { BFF_ERROR_CODES, BffError } from "@/lib/bff/errors";

export function parseBookmarkId(rawId: string | undefined): number {
	const id = Number(rawId);

	if (!Number.isInteger(id) || id <= 0) {
		throw new BffError(
			"ブックマークIDが不正です。",
			400,
			BFF_ERROR_CODES.BAD_REQUEST,
		);
	}

	return id;
}

export function assertLabelName(body: unknown): string {
	if (typeof body === "object" && body !== null && "labelName" in body) {
		const { labelName } = body as { labelName?: unknown };
		if (typeof labelName === "string" && labelName.trim().length > 0) {
			return labelName;
		}
	}

	throw new BffError(
		"labelNameが指定されていません。",
		400,
		BFF_ERROR_CODES.BAD_REQUEST,
	);
}
