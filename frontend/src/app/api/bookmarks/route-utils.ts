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
