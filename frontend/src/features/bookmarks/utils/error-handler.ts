/**
 * ブックマーク作成時のエラーハンドリングユーティリティ
 */

/**
 * APIエラーレスポンスの型定義
 */
interface ApiError extends Error {
	status?: number;
	code?: string;
}

/**
 * エラータイプに応じた適切なメッセージを返す
 */
export function getBookmarkErrorMessage(error: unknown): string {
	// APIエラーとして型チェック
	if (error && typeof error === "object" && "status" in error) {
		const apiError = error as ApiError;

		// HTTPステータスコードに基づくエラーメッセージ
		if (apiError.status === 409) {
			return "この記事は既に追加されています";
		}
		if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
			return "入力内容を確認してください";
		}
		if (apiError.status && apiError.status >= 500) {
			return "サーバーエラーが発生しました。しばらく時間をおいて再度お試しください";
		}
	}

	// ネットワークエラーの検出（Error型のチェック）
	if (error instanceof Error) {
		// ネットワークエラーの一般的なパターン
		if (
			error.name === "NetworkError" ||
			error.name === "TypeError" || // fetch失敗時によく発生
			error.message.toLowerCase().includes("network") ||
			error.message.toLowerCase().includes("fetch")
		) {
			return "ネットワークエラーが発生しました。接続を確認してください";
		}
	}

	// デフォルトメッセージ
	return "記事の追加に失敗しました";
}

/**
 * ページトップへスクロールする
 */
export function scrollToTop(): void {
	window.scrollTo({ top: 0, behavior: "smooth" });
}

// Vitest unit tests
if (import.meta.vitest) {
	const { describe, test, expect, vi } = import.meta.vitest;

	describe("getBookmarkErrorMessage", () => {
		test("409エラーの場合、重複メッセージを返す", () => {
			const error: ApiError = new Error("Conflict");
			error.status = 409;

			expect(getBookmarkErrorMessage(error)).toBe(
				"この記事は既に追加されています",
			);
		});

		test("400番台エラーの場合、バリデーションメッセージを返す", () => {
			const error: ApiError = new Error("Bad Request");
			error.status = 400;

			expect(getBookmarkErrorMessage(error)).toBe("入力内容を確認してください");
		});

		test("500番台エラーの場合、サーバーエラーメッセージを返す", () => {
			const error: ApiError = new Error("Internal Server Error");
			error.status = 500;

			expect(getBookmarkErrorMessage(error)).toBe(
				"サーバーエラーが発生しました。しばらく時間をおいて再度お試しください",
			);
		});

		test("NetworkErrorの場合、ネットワークエラーメッセージを返す", () => {
			const error = new Error("Network request failed");
			error.name = "NetworkError";

			expect(getBookmarkErrorMessage(error)).toBe(
				"ネットワークエラーが発生しました。接続を確認してください",
			);
		});

		test("TypeErrorの場合、ネットワークエラーメッセージを返す", () => {
			const error = new TypeError("Failed to fetch");

			expect(getBookmarkErrorMessage(error)).toBe(
				"ネットワークエラーが発生しました。接続を確認してください",
			);
		});

		test("未知のエラーの場合、デフォルトメッセージを返す", () => {
			const error = "Unknown error";

			expect(getBookmarkErrorMessage(error)).toBe("記事の追加に失敗しました");
		});

		test("nullの場合、デフォルトメッセージを返す", () => {
			expect(getBookmarkErrorMessage(null)).toBe("記事の追加に失敗しました");
		});
	});

	describe("scrollToTop", () => {
		test("window.scrollToが正しいパラメータで呼ばれる", () => {
			const scrollToSpy = vi.fn();
			Object.defineProperty(window, "scrollTo", {
				value: scrollToSpy,
				writable: true,
			});

			scrollToTop();

			expect(scrollToSpy).toHaveBeenCalledWith({
				top: 0,
				behavior: "smooth",
			});
		});
	});
}
