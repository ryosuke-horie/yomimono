const DEFAULT_API_URL =
	"https://effective-yomimono-api.ryosuke-horie37.workers.dev";

export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_URL;
