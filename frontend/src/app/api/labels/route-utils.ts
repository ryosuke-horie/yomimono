import { BFF_ERROR_CODES, BffError } from "@/lib/bff/errors";

export function parseLabelId(rawId: string | undefined): number {
	const id = Number(rawId);

	if (!Number.isInteger(id) || id <= 0) {
		throw new BffError(
			"ラベルIDが不正です。",
			400,
			BFF_ERROR_CODES.BAD_REQUEST,
		);
	}

	return id;
}
