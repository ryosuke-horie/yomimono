const DEFAULT_API_URL =
	"https://effective-yomimono-api.ryosuke-horie37.workers.dev";

export const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_URL;

// 設定値のログ出力（デバッグ用）
console.log("API Configuration:", {
	NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
	API_BASE_URL,
	environment: process.env.NODE_ENV,
});
