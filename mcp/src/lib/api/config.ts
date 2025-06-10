/**
 * API接続設定を管理する共通ライブラリ
 */

/**
 * APIのベースURLを取得する
 * 環境変数から読み込み、未設定の場合はデフォルト値を使用
 * @returns APIのベースURL
 */
export function getApiBaseUrl(): string {
	return (
		process.env.API_BASE_URL ||
		"https://effective-yomimono-api.ryosuke-horie37.workers.dev"
	);
}
